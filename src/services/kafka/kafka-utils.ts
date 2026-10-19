import { AclOperationTypes } from 'kafkajs'
import * as R from 'remeda'

import { PartitionLag, ResetOffsetTarget, TopicLag } from './types'

type PartitionOffset = {
    partition: number
    offset: string
}

type PartitionWatermarks = {
    partition: number
    low: string
    high: string
}

/**
 * Resolves earliest/latest into concrete offsets. The special -2/-1 sentinels must never be committed: the
 * Java client treats any negative committed offset as "no committed offset" and falls back to its
 * auto.offset.reset, which might be the opposite of what was asked for.
 */
export function resolveTargetOffsets(target: ResetOffsetTarget, watermarks: PartitionWatermarks[]): PartitionOffset[] {
    return R.pipe(
        watermarks,
        R.map((it) => ({ partition: it.partition, offset: target === 'earliest' ? it.low : it.high })),
        R.sortBy((it) => it.partition),
    )
}

const ACTIVE_MEMBERS_MESSAGE = 'Gruppen har aktive medlemmer. Stopp alle consumere i gruppen og prøv igjen.'

const KAFKA_ERROR_MESSAGES: ReadonlyMap<string, string> = new Map([
    ['UNKNOWN_MEMBER_ID', ACTIVE_MEMBERS_MESSAGE],
    ['ILLEGAL_GENERATION', ACTIVE_MEMBERS_MESSAGE],
    ['NON_EMPTY_GROUP', ACTIVE_MEMBERS_MESSAGE],
    ['REBALANCE_IN_PROGRESS', 'Gruppen rebalanserer. Stopp alle consumere i gruppen og prøv igjen.'],
    [
        'GROUP_SUBSCRIBED_TO_TOPIC',
        'Gruppen har aktive consumere som abonnerer på topicet. Stopp dem, eller fjern topicet fra appen, før offsets kan slettes.',
    ],
    ['GROUP_ID_NOT_FOUND', 'Fant ikke consumer groupen.'],
    ['UNKNOWN_TOPIC_OR_PARTITION', 'Topicet finnes ikke.'],
    ['TOPIC_AUTHORIZATION_FAILED', 'Zara mangler tilgang til topicet.'],
    ['GROUP_AUTHORIZATION_FAILED', 'Zara mangler tilgang til consumer groupen.'],
    ['GROUP_COORDINATOR_NOT_AVAILABLE', 'Group coordinator er ikke tilgjengelig akkurat nå. Prøv igjen om litt.'],
    ['GROUP_LOAD_IN_PROGRESS', 'Group coordinator laster fortsatt. Prøv igjen om litt.'],
    ['NOT_COORDINATOR_FOR_GROUP', 'Group coordinator har flyttet seg. Prøv igjen om litt.'],
])

/**
 * Turns kafkajs errors into something a human can act on. kafkajs wraps the actual protocol error when
 * retries are exhausted, so the cause chain is searched for a known error type.
 */
export function describeKafkaError(error: unknown): string {
    for (const type of kafkaErrorTypes(error)) {
        const message = KAFKA_ERROR_MESSAGES.get(type)
        if (message != null) {
            return message
        }
    }

    return error instanceof Error ? error.message : 'Ukjent feil'
}

/**
 * Protocol error types (e.g. NOT_COORDINATOR) of an error and its causes, kafkajs wraps the actual
 * protocol error when retries are exhausted.
 */
function kafkaErrorTypes(error: unknown): string[] {
    const types: string[] = []
    let current: unknown = error
    for (let depth = 0; depth < 5 && current instanceof Error; depth++) {
        const type: unknown = Reflect.get(current, 'type')
        if (typeof type === 'string') {
            types.push(type)
        }
        current = current.cause
    }
    return types
}

/**
 * Note: kafkajs uses the pre Kafka 2.0 names for the coordinator errors (e.g. NOT_COORDINATOR_FOR_GROUP
 * instead of NOT_COORDINATOR).
 */
const RETRIABLE_COORDINATOR_ERRORS: ReadonlySet<string> = new Set([
    'NOT_COORDINATOR_FOR_GROUP',
    'GROUP_COORDINATOR_NOT_AVAILABLE',
    'GROUP_LOAD_IN_PROGRESS',
])

/**
 * Retries an operation (which must look up the coordinator itself) when the coordinator has moved or
 * isn't ready, e.g. while a broker restarts or __consumer_offsets is still loading.
 */
export async function retryOnCoordinatorErrors<Result>(
    operation: () => Promise<Result>,
    {
        attempts = 5,
        backoffMs = 300,
        onRetry,
    }: { attempts?: number; backoffMs?: number; onRetry?: (error: unknown, attempt: number) => void } = {},
): Promise<Result> {
    for (let attempt = 1; ; attempt++) {
        try {
            return await operation()
        } catch (error) {
            const retriable = kafkaErrorTypes(error).some((it) => RETRIABLE_COORDINATOR_ERRORS.has(it))
            if (!retriable || attempt >= attempts) {
                throw error
            }

            onRetry?.(error, attempt)
            await new Promise((resolve) => setTimeout(resolve, backoffMs * 2 ** (attempt - 1)))
        }
    }
}

export function computeTopicLag(topic: string, committed: PartitionOffset[], endOffsets: PartitionOffset[]): TopicLag {
    const endByPartition = new Map(endOffsets.map((it) => [it.partition, Number(it.offset)]))

    const partitions: PartitionLag[] = R.pipe(
        committed,
        R.map((it) => {
            const currentOffset = Number(it.offset)
            const endOffset = endByPartition.get(it.partition) ?? currentOffset
            const lag = currentOffset < 0 ? Math.max(0, endOffset) : Math.max(0, endOffset - currentOffset)
            return { partition: it.partition, currentOffset, endOffset, lag }
        }),
        R.sortBy((it) => it.partition),
    )

    return {
        topic,
        partitions,
        totalLag: R.sumBy(partitions, (it) => it.lag),
    }
}

export function cleanAclPrincipal(principal: string): {
    team: string
    app: string
} {
    const cleaned = principal
        .replace(/^User:/, '')
        .replace(/\\-/g, '-')
        // strips the generated suffix, e.g. "_136f0f43_Z_b" or "_546790b1__C6"
        .replace(/_[0-9a-f]{8}_.*$/, '')

    const separatorIndex = cleaned.indexOf('_')
    if (separatorIndex === -1) {
        return { team: '', app: cleaned }
    }

    return {
        team: cleaned.slice(0, separatorIndex),
        app: cleaned.slice(separatorIndex + 1),
    }
}

export type AclAccess = 'read' | 'write' | 'read/write' | `unknown: ${number}`

/**
 * Kafka ACLs are atomic, one operation per binding. An app that both produces and consumes has two
 * separate bindings, so read/write only exists as an aggregate across all bindings for a principal.
 */
export function mergeOperationTypes(operations: AclOperationTypes[]): AclAccess {
    const canRead = operations.some((it) => it === AclOperationTypes.READ || it === AclOperationTypes.ALL)
    const canWrite = operations.some((it) => it === AclOperationTypes.WRITE || it === AclOperationTypes.ALL)

    if (canRead && canWrite) return 'read/write'
    if (canRead) return 'read'
    if (canWrite) return 'write'

    return `unknown: ${operations[0]}`
}
