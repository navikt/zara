import { KafkaJSNumberOfRetriesExceeded } from 'kafkajs'
import { createErrorFromCode } from 'kafkajs/src/protocol/error.js'
import { expect, test, vi } from 'vitest'

import { describeKafkaError, resolveTargetOffsets, retryOnCoordinatorErrors } from './kafka-utils'

const watermarks = [
    { partition: 1, low: '5', high: '50' },
    { partition: 0, low: '0', high: '42' },
]

test('earliest resolves to the low watermark of every partition, sorted by partition', () => {
    expect(resolveTargetOffsets('earliest', watermarks)).toEqual([
        { partition: 0, offset: '0' },
        { partition: 1, offset: '5' },
    ])
})

test('latest resolves to the high watermark of every partition', () => {
    expect(resolveTargetOffsets('latest', watermarks)).toEqual([
        { partition: 0, offset: '42' },
        { partition: 1, offset: '50' },
    ])
})

test('resolved offsets are never the negative earliest/latest sentinels', () => {
    const offsets = [...resolveTargetOffsets('earliest', watermarks), ...resolveTargetOffsets('latest', watermarks)]

    expect(offsets.every((it) => Number(it.offset) >= 0)).toBe(true)
})

test('known protocol errors are explained in Norwegian', () => {
    const groupSubscribedToTopic = createErrorFromCode(86)

    expect(describeKafkaError(groupSubscribedToTopic)).toContain('abonnerer på topicet')
})

test('every error we expect from offset operations is explained, using the kafkajs error type names', () => {
    // 3 UNKNOWN_TOPIC_OR_PARTITION, 14-16 coordinator errors, 22 ILLEGAL_GENERATION, 25 UNKNOWN_MEMBER_ID,
    // 27 REBALANCE_IN_PROGRESS, 29/30 authorization, 68 NON_EMPTY_GROUP, 69 GROUP_ID_NOT_FOUND,
    // 86 GROUP_SUBSCRIBED_TO_TOPIC
    for (const code of [3, 14, 15, 16, 22, 25, 27, 29, 30, 68, 69, 86]) {
        const error = createErrorFromCode(code)
        expect(describeKafkaError(error), `error code ${code} (${error.type})`).not.toBe(error.message)
    }
})

test('protocol errors wrapped by exhausted retries are still recognized', () => {
    const unknownMemberId = createErrorFromCode(25)
    const wrapped = new KafkaJSNumberOfRetriesExceeded(unknownMemberId, { retryCount: 5, retryTime: 1000 })

    expect(describeKafkaError(wrapped)).toContain('aktive medlemmer')
})

test('unknown errors fall back to their own message', () => {
    expect(describeKafkaError(new Error('Consumer group foo finnes allerede'))).toBe(
        'Consumer group foo finnes allerede',
    )
    expect(describeKafkaError('not an error')).toBe('Ukjent feil')
})

test('coordinator errors are retried until the operation succeeds', async () => {
    const notCoordinator = createErrorFromCode(16)
    const loadInProgress = createErrorFromCode(14)
    const operation = vi
        .fn<() => Promise<string>>()
        .mockRejectedValueOnce(notCoordinator)
        .mockRejectedValueOnce(loadInProgress)
        .mockResolvedValueOnce('committed')
    const onRetry = vi.fn<(error: unknown, attempt: number) => void>()

    expect(await retryOnCoordinatorErrors(operation, { backoffMs: 0, onRetry })).toBe('committed')
    expect(operation).toHaveBeenCalledTimes(3)
    expect(onRetry).toHaveBeenCalledTimes(2)
})

test('coordinator errors are thrown when attempts are exhausted', async () => {
    const notCoordinator = createErrorFromCode(16)
    const operation = vi.fn<() => Promise<string>>().mockRejectedValue(notCoordinator)

    await expect(retryOnCoordinatorErrors(operation, { attempts: 3, backoffMs: 0 })).rejects.toBe(notCoordinator)
    expect(operation).toHaveBeenCalledTimes(3)
})

test('other errors are not retried', async () => {
    const unknownMemberId = createErrorFromCode(25)
    const operation = vi.fn<() => Promise<string>>().mockRejectedValue(unknownMemberId)

    await expect(retryOnCoordinatorErrors(operation, { backoffMs: 0 })).rejects.toBe(unknownMemberId)
    expect(operation).toHaveBeenCalledTimes(1)
})
