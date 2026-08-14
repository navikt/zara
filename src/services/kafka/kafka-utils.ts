import { AclOperationTypes } from 'kafkajs'
import * as R from 'remeda'

import { PartitionLag, TopicLag } from './types'

type PartitionOffset = {
    partition: number
    offset: string
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
