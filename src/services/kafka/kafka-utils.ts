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
