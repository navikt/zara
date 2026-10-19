'use server'

import { logger } from '@navikt/next-logger'
import { refresh } from 'next/cache'
import * as z from 'zod'

import { validateUserSession } from '#services/auth/auth'
import {
    createConsumerGroup,
    deleteConsumerGroupTopicOffsets,
    resetConsumerGroupOffsets,
} from '#services/kafka/kafka-admin-service'
import { describeKafkaError } from '#services/kafka/kafka-utils'
import { ResetOffsetTarget } from '#services/kafka/types'

export type KafkaActionResult = { ok: true } | { ok: false; error: string }

const GroupIdSchema = z.string().trim().min(1, 'Group ID kan ikke være tom').max(255, 'Group ID er for lang')
const TopicSchema = z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9._-]{1,249}$/, 'Ugyldig topicnavn')
const TargetSchema = z.enum(['earliest', 'latest'] satisfies ResetOffsetTarget[])

const TopicOffsetsSchema = z.object({ groupId: GroupIdSchema, topic: TopicSchema })
const TopicOffsetsTargetSchema = TopicOffsetsSchema.extend({ target: TargetSchema })

export async function resetTopicOffsets(
    groupId: string,
    topic: string,
    target: ResetOffsetTarget,
): Promise<KafkaActionResult> {
    const user = await validateUserSession('UTVIKLER')
    const input = TopicOffsetsTargetSchema.safeParse({ groupId, topic, target })
    if (!input.success) return invalidInput(input.error)

    return runKafkaAction(() =>
        resetConsumerGroupOffsets(input.data.groupId, input.data.topic, input.data.target, user),
    )
}

export async function deleteTopicOffsets(groupId: string, topic: string): Promise<KafkaActionResult> {
    const user = await validateUserSession('UTVIKLER')
    const input = TopicOffsetsSchema.safeParse({ groupId, topic })
    if (!input.success) return invalidInput(input.error)

    return runKafkaAction(() => deleteConsumerGroupTopicOffsets(input.data.groupId, input.data.topic, user))
}

export async function createGroup(
    groupId: string,
    topic: string,
    target: ResetOffsetTarget,
): Promise<KafkaActionResult> {
    const user = await validateUserSession('UTVIKLER')
    const input = TopicOffsetsTargetSchema.safeParse({ groupId, topic, target })
    if (!input.success) return invalidInput(input.error)

    return runKafkaAction(() => createConsumerGroup(input.data.groupId, input.data.topic, input.data.target, user))
}

async function runKafkaAction(action: () => Promise<void>): Promise<KafkaActionResult> {
    try {
        await action()
    } catch (error) {
        logger.error(error)
        return { ok: false, error: describeKafkaError(error) }
    }

    refresh()
    return { ok: true }
}

function invalidInput(error: z.ZodError): KafkaActionResult {
    return { ok: false, error: error.issues.map((it) => it.message).join(', ') }
}
