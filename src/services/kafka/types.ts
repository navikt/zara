export type ConsumerGroupState = 'Unknown' | 'PreparingRebalance' | 'CompletingRebalance' | 'Stable' | 'Dead' | 'Empty'

export type PartitionLag = {
    partition: number
    currentOffset: number
    endOffset: number
    lag: number
}

export type TopicLag = {
    topic: string
    partitions: PartitionLag[]
    totalLag: number
}

export type ConsumerGroupDetails = {
    groupId: string
    state: ConsumerGroupState
    active: boolean
    memberCount: number
    topics: TopicLag[]
    totalLag: number
}

export type ResetOffsetTarget = 'earliest' | 'latest'
