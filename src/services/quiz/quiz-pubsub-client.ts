import { logger } from '@navikt/next-logger'

import { createValkeySubscriber, valkeyClient } from '@services/db/valkey/production-valkey'
import { QuizEvent } from '@services/quiz/quiz-schema'

const LOBBY_CHANNEL = 'channel:quiz:lobby'

function sessionChannel(sessionId: string): string {
    return `channel:quiz:${sessionId}`
}

export async function publishQuizEvent(sessionId: string, event: QuizEvent): Promise<void> {
    await valkeyClient().publish(sessionChannel(sessionId), JSON.stringify(event))
}

export async function publishLobbyChanged(): Promise<void> {
    await valkeyClient().publish(LOBBY_CHANNEL, 'changed')
}

/**
 * Subscribes to a single live session's events. Uses a dedicated connection (see
 * {@link createValkeySubscriber}) so concurrent session streams don't interfere with each
 * other. The returned cleanup function quits the connection.
 */
export async function subscribeToQuizSession(
    sessionId: string,
    onEvent: (event: QuizEvent) => void,
): Promise<() => Promise<void>> {
    const sub = createValkeySubscriber()
    const channel = sessionChannel(sessionId)
    try {
        await sub.subscribe(channel)
    } catch (e) {
        await sub.quit().catch(() => {})
        throw e
    }

    const handler = (incomingChannel: string, message: string): void => {
        if (incomingChannel !== channel) return
        try {
            onEvent(JSON.parse(message) as QuizEvent)
        } catch (e) {
            logger.error(new Error(`Failed to parse quiz event on ${channel}: ${message}`, { cause: e }))
        }
    }
    sub.on('message', handler)

    return async () => {
        sub.removeListener('message', handler)
        await sub.quit()
    }
}

export async function subscribeToLobby(onChange: () => void): Promise<() => Promise<void>> {
    const sub = createValkeySubscriber()
    try {
        await sub.subscribe(LOBBY_CHANNEL)
    } catch (e) {
        await sub.quit().catch(() => {})
        throw e
    }

    const handler = (incomingChannel: string): void => {
        if (incomingChannel === LOBBY_CHANNEL) onChange()
    }
    sub.on('message', handler)

    return async () => {
        sub.removeListener('message', handler)
        await sub.quit()
    }
}
