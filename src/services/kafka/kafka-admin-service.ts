import { logger } from '@navikt/next-logger'
import {
    AclOperationTypes,
    AclPermissionTypes,
    AclResourceTypes,
    ConfigResourceTypes,
    type Admin,
    Kafka,
    type KafkaConfig,
    logLevel,
    ResourcePatternTypes,
} from 'kafkajs'
import { lazyNextleton } from 'nextleton'
import * as R from 'remeda'

import { getServerEnv } from '#lib/env'
import { User } from '#services/auth/user'

import { AclAccess, cleanAclPrincipal, computeTopicLag, mergeOperationTypes } from './kafka-utils'
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

    const [committed, described] = await Promise.all([admin.fetchOffsets({ groupId }), admin.describeGroups([groupId])])
    const group = described.groups.find((it) => it.groupId === groupId)
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

export async function resetConsumerGroupOffsets(
    groupId: string,
    topic: string,
    target: ResetOffsetTarget,
    user: User,
): Promise<void> {
    logger.info(`Resetting offsets for group ${groupId}, topic ${topic} to ${target} (by ${user.userId})`)

    const admin = await getAdmin()
    await admin.resetOffsets({ groupId, topic, earliest: target === 'earliest' })
}

export async function deleteConsumerGroup(groupId: string, user: User): Promise<void> {
    logger.info(`Deleting consumer group ${groupId} (by ${user.userId})`)
    const admin = await getAdmin()
    await admin.deleteGroups([groupId])
}
