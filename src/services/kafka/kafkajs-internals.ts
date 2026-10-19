import { type Kafka } from 'kafkajs'
import type Encoder from 'kafkajs/src/protocol/encoder.js'

/**
 * kafkajs' public Admin API can only move consumer group offsets by joining the group as a consumer and
 * seeking, and it has no support for OffsetDelete (KIP-496) at all. To do what Kafka's own AdminClient
 * does (alterConsumerGroupOffsets / deleteConsumerGroupOffsets), we talk to the group coordinator
 * directly through kafkajs' internal cluster and broker abstractions.
 *
 * kafkajs is no longer maintained (2.2.4 is the final release), so these internals are stable in
 * practice, but every access is guarded so a change fails loudly instead of silently misbehaving.
 */

export type ApiVersions = Record<number, { minVersion: number; maxVersion: number } | undefined>

export type ProtocolRequest<Data> = {
    request: {
        apiKey: number
        apiVersion: number
        apiName: string
        encode: () => Promise<Encoder>
    }
    response: {
        decode: (payload: Buffer) => Promise<Data>
        parse: (data: Data) => Promise<Data>
    }
}

export type CommitPartition = {
    partition: number
    offset: string
}

export type InternalBroker = {
    versions: ApiVersions | null
    offsetCommit(request: {
        groupId: string
        groupGenerationId: number
        memberId: string
        topics: { topic: string; partitions: CommitPartition[] }[]
    }): Promise<unknown>
    connectionPool: {
        send<Data>(protocolRequest: ProtocolRequest<Data>): Promise<Data>
    }
}

export type InternalCluster = {
    connect(): Promise<void>
    disconnect(): Promise<void>
    findGroupCoordinator(request: { groupId: string }): Promise<InternalBroker>
}

type ClusterFactory = (options: { allowAutoTopicCreation: boolean }) => InternalCluster

const CREATE_CLUSTER_SYMBOL_DESCRIPTION = 'private:Kafka:createCluster'

/**
 * Creates a kafkajs Cluster using the same factory (and thus the same brokers, SSL config, retry and
 * logger) as kafka.admin() does internally.
 */
export function createInternalCluster(kafka: Kafka): InternalCluster {
    const symbol = Object.getOwnPropertySymbols(kafka).find(
        (it) => it.description === CREATE_CLUSTER_SYMBOL_DESCRIPTION,
    )
    const factory: unknown = symbol != null ? Reflect.get(kafka, symbol) : undefined

    if (typeof factory !== 'function') {
        throw new Error(`kafkajs internals have changed, unable to find '${CREATE_CLUSTER_SYMBOL_DESCRIPTION}'`)
    }

    const cluster = (factory as ClusterFactory)({ allowAutoTopicCreation: false })
    if (typeof cluster.findGroupCoordinator !== 'function') {
        throw new Error('kafkajs internals have changed, cluster has no findGroupCoordinator')
    }

    return cluster
}

export function assertBrokerSupports(
    broker: InternalBroker,
    apiKey: number,
    apiVersion: number,
    apiName: string,
): void {
    const supported = broker.versions?.[apiKey]
    if (supported == null || apiVersion < supported.minVersion || apiVersion > supported.maxVersion) {
        throw new Error(`Kafka-brokeren støtter ikke ${apiName} v${apiVersion}`)
    }
}
