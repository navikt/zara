import { expect, test } from 'vitest'

import {
    decodeOffsetDeleteResponse,
    encodeOffsetDeleteRequest,
    firstOffsetDeleteErrorCode,
    throwIfOffsetDeleteFailed,
} from './offset-delete-protocol'

function int16(value: number): Buffer {
    const buffer = Buffer.alloc(2)
    buffer.writeInt16BE(value)
    return buffer
}

function int32(value: number): Buffer {
    const buffer = Buffer.alloc(4)
    buffer.writeInt32BE(value)
    return buffer
}

function string(value: string): Buffer {
    return Buffer.concat([int16(Buffer.byteLength(value)), Buffer.from(value, 'utf8')])
}

test('the request is encoded as group_id [name [partition_index]]', () => {
    const encoded = encodeOffsetDeleteRequest('my-group', [{ topic: 'tsm.topic', partitions: [0, 2] }]).buffer

    expect(encoded).toEqual(
        Buffer.concat([string('my-group'), int32(1), string('tsm.topic'), int32(2), int32(0), int32(2)]),
    )
})

test('the response is decoded as error_code throttle_time_ms [name [partition_index error_code]]', () => {
    const payload = Buffer.concat([
        int16(0),
        int32(12),
        int32(1),
        string('tsm.topic'),
        int32(2),
        int32(0),
        int16(0),
        int32(1),
        int16(86),
    ])

    expect(decodeOffsetDeleteResponse(payload)).toEqual({
        errorCode: 0,
        throttleTimeMs: 12,
        topics: [
            {
                topic: 'tsm.topic',
                partitions: [
                    { partition: 0, errorCode: 0 },
                    { partition: 1, errorCode: 86 },
                ],
            },
        ],
    })
})

test('a successful response has no error', () => {
    const response = {
        errorCode: 0,
        throttleTimeMs: 0,
        topics: [{ topic: 'tsm.topic', partitions: [{ partition: 0, errorCode: 0 }] }],
    }

    expect(firstOffsetDeleteErrorCode(response)).toBeNull()
    expect(() => throwIfOffsetDeleteFailed(response)).not.toThrow()
})

test('the top-level error code takes precedence over partition errors', () => {
    const response = {
        errorCode: 69,
        throttleTimeMs: 0,
        topics: [{ topic: 'tsm.topic', partitions: [{ partition: 0, errorCode: 86 }] }],
    }

    expect(firstOffsetDeleteErrorCode(response)).toBe(69)
})

test('partition errors are thrown as kafkajs protocol errors', () => {
    const response = {
        errorCode: 0,
        throttleTimeMs: 0,
        topics: [{ topic: 'tsm.topic', partitions: [{ partition: 3, errorCode: 86 }] }],
    }

    expect(() => throwIfOffsetDeleteFailed(response)).toThrow(
        expect.objectContaining({ name: 'KafkaJSProtocolError', type: 'GROUP_SUBSCRIBED_TO_TOPIC' }),
    )
})
