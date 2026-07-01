'use server'

import { logger } from '@navikt/next-logger'
import { revalidatePath } from 'next/cache'

import { validateUserSession } from '#services/auth/auth'
import { deleteConsumerGroup, resetConsumerGroupOffsets } from '#services/kafka/kafka-admin-service'
import { ResetOffsetTarget } from '#services/kafka/types'

export type KafkaActionResult<T = undefined> = { ok: true; value: T } | { ok: false; error: string }

export async function resetOffsets(
    groupId: string,
    topic: string,
    target: ResetOffsetTarget,
): Promise<KafkaActionResult> {
    const user = await validateUserSession('UTVIKLER')

    try {
        await resetConsumerGroupOffsets(groupId, topic, target, user)
    } catch (error) {
        logger.error(error)
        return { ok: false, error: error instanceof Error ? error.message : 'Ukjent feil' }
    }
    revalidatePath('/vakt/kafka')
    return { ok: true, value: undefined }
}

export async function deleteGroup(groupId: string): Promise<KafkaActionResult> {
    const user = await validateUserSession('UTVIKLER')

    try {
        await deleteConsumerGroup(groupId, user)
    } catch (error) {
        logger.error(error)
        return { ok: false, error: error instanceof Error ? error.message : 'Ukjent feil' }
    }
    revalidatePath('/vakt/kafka')
    return { ok: true, value: undefined }
}
