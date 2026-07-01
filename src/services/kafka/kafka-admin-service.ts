import { logger } from '@navikt/next-logger'
import { Kafka, logLevel, type Admin, type KafkaConfig } from 'kafkajs'
import { lazyNextleton } from 'nextleton'
import * as R from 'remeda'

import { getServerEnv } from '#lib/env'
import { User } from '#services/auth/user'

import { computeTopicLag } from './kafka-utils'
import { ConsumerGroupDetails, ConsumerGroupState, ResetOffsetTarget, TopicLag } from './types'

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

export async function getConsumerGroupDetails(groupId: string): Promise<ConsumerGroupDetails | null> {
    const admin = await getAdmin()

    const [committed, described] = await Promise.all([admin.fetchOffsets({ groupId }), admin.describeGroups([groupId])])
    const group = described.groups.find((it) => it.groupId === groupId)
    const state = toConsumerGroupState(group?.state)
    const memberCount = group?.members.length ?? 0

    const topics: TopicLag[] = await Promise.all(
        committed.map(
            async ({ topic, partitions }): Promise<TopicLag> =>
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
