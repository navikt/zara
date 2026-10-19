import Decoder from 'kafkajs/src/protocol/decoder.js'
import Encoder from 'kafkajs/src/protocol/encoder.js'
import { createErrorFromCode } from 'kafkajs/src/protocol/error.js'

import { type ProtocolRequest } from './kafkajs-internals'

/**
 * OffsetDelete (KIP-496), the API behind `kafka-consumer-groups --delete-offsets`, which kafkajs lacks.
 *
 * Only v0 is implemented, it is supported by every broker since Kafka 2.4 and is non-flexible, so it uses
 * the same request/response headers as everything else kafkajs sends.
 *
 * OffsetDelete Request (Version: 0) => group_id [topics]
 *   group_id => STRING
 *   topics => name [partitions]
 *     name => STRING
 *     partitions => partition_index
 *       partition_index => INT32
 *
 * OffsetDelete Response (Version: 0) => error_code throttle_time_ms [topics]
 *   error_code => INT16
 *   throttle_time_ms => INT32
 *   topics => name [partitions]
 *     name => STRING
 *     partitions => partition_index error_code
 *       partition_index => INT32
 *       error_code => INT16
 */

export const OFFSET_DELETE_API_KEY = 47
export const OFFSET_DELETE_API_VERSION = 0

export type OffsetDeleteTopic = {
    topic: string
    partitions: number[]
}

export type OffsetDeleteResponse = {
    errorCode: number
    throttleTimeMs: number
    topics: {
        topic: string
        partitions: { partition: number; errorCode: number }[]
    }[]
}

export function encodeOffsetDeleteRequest(groupId: string, topics: OffsetDeleteTopic[]): Encoder {
    return new Encoder()
        .writeString(groupId)
        .writeArray(
            topics.map(({ topic, partitions }) => new Encoder().writeString(topic).writeArray(partitions, 'int32')),
        )
}

export function decodeOffsetDeleteResponse(payload: Buffer): OffsetDeleteResponse {
    const decoder = new Decoder(payload)

    return {
        errorCode: decoder.readInt16(),
        throttleTimeMs: decoder.readInt32(),
        topics: decoder.readArray((topicDecoder) => ({
            topic: topicDecoder.readString(),
            partitions: topicDecoder.readArray((partitionDecoder) => ({
                partition: partitionDecoder.readInt32(),
                errorCode: partitionDecoder.readInt16(),
            })),
        })),
    }
}

/**
 * The top-level error code is used for group-level failures (e.g. GROUP_ID_NOT_FOUND), while the
 * partition error codes cover per-partition failures (e.g. GROUP_SUBSCRIBED_TO_TOPIC).
 */
export function firstOffsetDeleteErrorCode(response: OffsetDeleteResponse): number | null {
    if (response.errorCode !== 0) return response.errorCode

    const partitionError = response.topics.flatMap((it) => it.partitions).find((it) => it.errorCode !== 0)

    return partitionError?.errorCode ?? null
}

export function offsetDeleteRequest(
    groupId: string,
    topics: OffsetDeleteTopic[],
): ProtocolRequest<OffsetDeleteResponse> {
    return {
        request: {
            apiKey: OFFSET_DELETE_API_KEY,
            apiVersion: OFFSET_DELETE_API_VERSION,
            apiName: 'OffsetDelete',
            encode: async () => encodeOffsetDeleteRequest(groupId, topics),
        },
        response: {
            decode: async (payload) => decodeOffsetDeleteResponse(payload),
            parse: async (data) => data,
        },
    }
}

export function throwIfOffsetDeleteFailed(response: OffsetDeleteResponse): void {
    const errorCode = firstOffsetDeleteErrorCode(response)
    if (errorCode != null) {
        throw createErrorFromCode(errorCode)
    }
}
