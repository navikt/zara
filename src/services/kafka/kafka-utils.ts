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
        .replace(/_[^_]*_+[^_]*$/, '')

    const separatorIndex = cleaned.indexOf('_')
    if (separatorIndex === -1) {
        return { team: '', app: cleaned }
    }

    return {
        team: cleaned.slice(0, separatorIndex),
        app: cleaned.slice(separatorIndex + 1),
    }
}

export function operationType(operation: AclOperationTypes): 'read' | 'write' | 'read/write' | `unknown: ${number}` {
    switch (operation) {
        case AclOperationTypes.READ:
            return 'read'
        case AclOperationTypes.WRITE:
            return 'write'
        case AclOperationTypes.UNKNOWN:
        case AclOperationTypes.ANY:
        case AclOperationTypes.ALL:
        case AclOperationTypes.CREATE:
        case AclOperationTypes.DELETE:
        case AclOperationTypes.ALTER:
        case AclOperationTypes.DESCRIBE:
        case AclOperationTypes.CLUSTER_ACTION:
        case AclOperationTypes.DESCRIBE_CONFIGS:
        case AclOperationTypes.ALTER_CONFIGS:
        case AclOperationTypes.IDEMPOTENT_WRITE:
            return `unknown: ${operation}`
    }
}
