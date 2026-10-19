import { logger } from '@navikt/next-logger'
import {
    AclOperationTypes,
    AclPermissionTypes,
    AclResourceTypes,
    ConfigResourceTypes,
    type Admin,
    type GroupDescription,
    Kafka,
    type KafkaConfig,
    logLevel,
    ResourcePatternTypes,
} from 'kafkajs'
import { lazyNextleton } from 'nextleton'
import * as R from 'remeda'

import { getServerEnv } from '#lib/env'
import { User } from '#services/auth/user'

import {
    AclAccess,
    cleanAclPrincipal,
    computeTopicLag,
    mergeOperationTypes,
    resolveTargetOffsets,
    retryOnCoordinatorErrors,
} from './kafka-utils'
import {
    assertBrokerSupports,
    type CommitPartition,
    createInternalCluster,
    type InternalBroker,
    type InternalCluster,
} from './kafkajs-internals'
import {
    OFFSET_DELETE_API_KEY,
    OFFSET_DELETE_API_VERSION,
    offsetDeleteRequest,
    throwIfOffsetDeleteFailed,
} from './offset-delete-protocol'
import { ConsumerGroupDetails, ConsumerGroupState, ResetOffsetTarget, TopicDetails, TopicLag } from './types'

const KNOWN_STATES: ReadonlySet<string> = new Set<ConsumerGroupState>([
    'Unknown',
    'PreparingRebalance',
    'CompletingRebalance',
    'Stable',
    'Dead',
    'Empty',
])

function toConsumerGroupState(state: string | undefined): ConsumerGroupState {
    return state != null && KNOWN_STATES.has(state) ? (state as ConsumerGroupState) : 'Unknown'
}

const ACTIVE_STATES: ReadonlySet<ConsumerGroupState> = new Set<ConsumerGroupState>([
    'Stable',
    'PreparingRebalance',
    'CompletingRebalance',
])

function buildKafkaClient(): Kafka {
    const kafkaConfig = getServerEnv().kafkaConfig
    const config: KafkaConfig = {
        clientId: 'zara',
        brokers: kafkaConfig.brokers.split(','),
        logLevel: logLevel.ERROR,
    }
    if (kafkaConfig.runtimeEnv !== 'local') {
        config.ssl = {
            ca: [kafkaConfig.ca],
            cert: kafkaConfig.certificate,
            key: kafkaConfig.privateKey,
        }
    }

    return new Kafka(config)
}

const cachedAdmin = lazyNextleton('kafka-admin', async (): Promise<Admin> => {
    const admin = buildKafkaClient().admin()
    logger.info('Connecting Kafka admin client...')
    await admin.connect()
    return admin
})

async function getAdmin(): Promise<Admin> {
    try {
        return await cachedAdmin()
    } catch (error) {
        logger.warn(new Error(`Kafka admin connection failed, retrying with a fresh client`, { cause: error }))
        cachedAdmin.reset()
        return cachedAdmin()
    }
}

/**
 * Low level kafkajs cluster, used to talk directly to group coordinators for the operations kafkajs'
 * Admin API doesn't support properly. See kafkajs-internals.ts.
 */
const cachedCluster = lazyNextleton('kafka-internal-cluster', async (): Promise<InternalCluster> => {
    const cluster = createInternalCluster(buildKafkaClient())
    logger.info('Connecting internal Kafka cluster client...')
    await cluster.connect()
    return cluster
})

async function getGroupCoordinator(groupId: string): Promise<InternalBroker> {
    let cluster: InternalCluster
    try {
        cluster = await cachedCluster()
    } catch (error) {
        logger.warn(new Error(`Kafka cluster connection failed, retrying with a fresh client`, { cause: error }))
        cachedCluster.reset()
        cluster = await cachedCluster()
    }

    return cluster.findGroupCoordinator({ groupId })
}

export async function getTopics(namespace: string): Promise<string[]> {
    const admin = await getAdmin()
    const topics = await admin.listTopics()

    return R.pipe(topics, R.filter(R.startsWith(`${namespace}.`)), R.sortBy([(it) => it.includes('stream'), 'asc']))
}

export async function getTopicInfo(topic: string): Promise<
    {
        team: string
        app: string
        access: AclAccess
    }[]
> {
    const admin = await getAdmin()
    const acl = await admin.describeAcls({
        resourceName: topic.replace(/\./g, '\\.').replace(/-/g, '\\-'),
        resourceType: AclResourceTypes.TOPIC,
        resourcePatternType: ResourcePatternTypes.ANY,
        operation: AclOperationTypes.ANY,
        permissionType: AclPermissionTypes.ANY,
    })

    if (acl.resources.length === 0) return []
    const [topicResource] = acl.resources

    return R.pipe(
        topicResource.acls,
        R.map((it) => ({ ...cleanAclPrincipal(it.principal), operation: it.operation })),
        R.groupBy((it) => `${it.team}:${it.app}`),
        R.values(),
        R.map((entries) => ({
            team: entries[0].team,
            app: entries[0].app,
            access: mergeOperationTypes(entries.map((it) => it.operation)),
        })),
    )
}

export async function getTopicDetails(topic: string): Promise<TopicDetails> {
    const admin = await getAdmin()

    const [metadata, configs] = await Promise.all([
        admin.fetchTopicMetadata({ topics: [topic] }),
        admin.describeConfigs({
            includeSynonyms: false,
            resources: [{ type: ConfigResourceTypes.TOPIC, name: topic }],
        }),
    ])

    const partitions = metadata.topics[0]?.partitions ?? []
    const entries = configs.resources[0]?.configEntries ?? []
    const configValue = (name: string): string | null =>
        entries.find((it) => it.configName === name)?.configValue ?? null

    return {
        topic,
        partitions: partitions.length,
        replicationFactor: partitions[0]?.replicas.length ?? 0,
        underReplicatedPartitions: partitions.filter((it) => it.isr.length < it.replicas.length).length,
        retention: configValue('retention.ms'),
        cleanupPolicy: configValue('cleanup.policy'),
    }
}

export async function getConsumerGroupDetails(groupId: string): Promise<ConsumerGroupDetails | null> {
    const admin = await getAdmin()

    const { committed, group } = await fetchCommittedAndDescribed(admin, groupId)
    const state = toConsumerGroupState(group?.state)
    const memberCount = group?.members.length ?? 0

    const topics: TopicLag[] = await Promise.all(
        committed.map(async ({ topic, partitions }): Promise<TopicLag> =>
            computeTopicLag(topic, partitions, await admin.fetchTopicOffsets(topic)),
        ),
    )

    const hasData = memberCount > 0 || topics.length > 0
    if (!hasData && (state === 'Dead' || state === 'Unknown')) {
        return null
    }

    const sortedTopics = R.sortBy(topics, (it) => it.topic)

    return {
        groupId,
        state,
        active: ACTIVE_STATES.has(state),
        memberCount,
        topics: sortedTopics,
        totalLag: R.sumBy(sortedTopics, (it) => it.totalLag),
    }
}

/**
 * Moves the group's committed offsets for a single topic to earliest/latest, without touching any of
 * the group's other topics. The broker rejects this if the group has active members.
 */
export async function resetConsumerGroupOffsets(
    groupId: string,
    topic: string,
    target: ResetOffsetTarget,
    user: User,
): Promise<void> {
    logger.info(`Resetting offsets for group ${groupId}, topic ${topic} to ${target} (by ${user.userId})`)

    const admin = await getAdmin()
    await assertTopicExists(admin, topic)

    const offsets = resolveTargetOffsets(target, await admin.fetchTopicOffsets(topic))
    await commitGroupOffsets(groupId, topic, offsets)
}

/**
 * Removes the group's committed offsets for a single topic, the equivalent of
 * `kafka-consumer-groups --delete-offsets --group <group> --topic <topic>`. The broker rejects this if
 * the group has active members subscribed to the topic, but allows it for topics the group no longer reads.
 */
export async function deleteConsumerGroupTopicOffsets(groupId: string, topic: string, user: User): Promise<void> {
    logger.info(`Deleting offsets for group ${groupId}, topic ${topic} (by ${user.userId})`)

    const admin = await getAdmin()
    const committed = await retryCoordinatorCall(groupId, () => admin.fetchOffsets({ groupId }))
    const partitions = committed.find((it) => it.topic === topic)?.partitions.map((it) => it.partition) ?? []
    if (partitions.length === 0) {
        throw new Error(`Consumer group ${groupId} har ingen committede offsets på ${topic}`)
    }

    await withGroupCoordinator(groupId, async (coordinator) => {
        assertBrokerSupports(coordinator, OFFSET_DELETE_API_KEY, OFFSET_DELETE_API_VERSION, 'OffsetDelete')

        const response = await coordinator.connectionPool.send(offsetDeleteRequest(groupId, [{ topic, partitions }]))
        throwIfOffsetDeleteFailed(response)
    })
}

/**
 * Creates a new consumer group by committing offsets at earliest/latest for the given topic. Refuses to
 * touch a group that already exists, so a typo can't silently move a real group's offsets.
 */
export async function createConsumerGroup(
    groupId: string,
    topic: string,
    target: ResetOffsetTarget,
    user: User,
): Promise<void> {
    logger.info(`Creating consumer group ${groupId} on topic ${topic} at ${target} (by ${user.userId})`)

    const admin = await getAdmin()
    await assertTopicExists(admin, topic)

    const { committed, group } = await fetchCommittedAndDescribed(admin, groupId)
    if ((group?.members.length ?? 0) > 0 || committed.length > 0) {
        throw new Error(`Consumer group ${groupId} finnes allerede`)
    }

    const offsets = resolveTargetOffsets(target, await admin.fetchTopicOffsets(topic))
    await commitGroupOffsets(groupId, topic, offsets)
}

/**
 * Commits offsets the way Kafka's AdminClient#alterConsumerGroupOffsets does: straight to the group
 * coordinator, as a non-member (generation -1, empty member id). The coordinator only accepts this when
 * the group has no active members, and creates the group if it does not exist.
 */
async function commitGroupOffsets(groupId: string, topic: string, partitions: CommitPartition[]): Promise<void> {
    if (partitions.length === 0) {
        throw new Error(`Fant ingen partisjoner for ${topic}`)
    }

    await withGroupCoordinator(groupId, (coordinator) =>
        coordinator.offsetCommit({
            groupId,
            groupGenerationId: -1,
            memberId: '',
            topics: [{ topic, partitions }],
        }),
    )
}

/**
 * Runs an operation against the group's coordinator, finding the coordinator again and retrying if it
 * moved or isn't ready yet (e.g. during broker restarts), like Kafka's own AdminClient does.
 */
async function withGroupCoordinator<Result>(
    groupId: string,
    operation: (coordinator: InternalBroker) => Promise<Result>,
): Promise<Result> {
    return retryCoordinatorCall(groupId, async () => operation(await getGroupCoordinator(groupId)))
}

/**
 * kafkajs' admin client looks up the coordinator on every call, but doesn't retry when it has moved
 * or isn't ready yet.
 */
async function retryCoordinatorCall<Result>(groupId: string, operation: () => Promise<Result>): Promise<Result> {
    return retryOnCoordinatorErrors(operation, {
        onRetry: (error, attempt) =>
            logger.warn(new Error(`Group coordinator for ${groupId} not ready (attempt ${attempt})`, { cause: error })),
    })
}

async function fetchCommittedAndDescribed(
    admin: Admin,
    groupId: string,
): Promise<{
    committed: Awaited<ReturnType<Admin['fetchOffsets']>>
    group: GroupDescription | undefined
}> {
    const [committed, described] = await Promise.all([
        retryCoordinatorCall(groupId, () => admin.fetchOffsets({ groupId })),
        retryCoordinatorCall(groupId, () => admin.describeGroups([groupId])),
    ])

    return { committed, group: described.groups.find((it) => it.groupId === groupId) }
}

/**
 * kafkajs treats an unknown topic as retriable and keeps retrying for a long time before giving up, so
 * user-provided topics are checked up front to fail fast with a clear message.
 */
async function assertTopicExists(admin: Admin, topic: string): Promise<void> {
    const topics = await admin.listTopics()
    if (!topics.includes(topic)) {
        throw new Error(`Topicet ${topic} finnes ikke`)
    }
}
