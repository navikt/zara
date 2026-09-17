import { logger } from '@navikt/next-logger'
import { GlideClient, GlideClientConfiguration, PubSubMsg } from '@valkey/valkey-glide'

import { getGlideClientConfig, realValkey } from '#services/db/valkey/production-valkey'
import { QuizEvent } from '#services/quiz/quiz-schema'

const LOBBY_CHANNEL = 'channel:quiz:lobby'

function sessionChannel(sessionId: string): string {
    return `channel:quiz:${sessionId}`
}

export async function publishQuizEvent(sessionId: string, event: QuizEvent): Promise<void> {
    const valkey = await realValkey()
    await valkey.publish(JSON.stringify(event), sessionChannel(sessionId))
}

export async function publishLobbyChanged(): Promise<void> {
    const valkey = await realValkey()
    await valkey.publish('changed', LOBBY_CHANNEL)
}

/**
 * Creates a dedicated subscriber connection listening on a single channel. Valkey GLIDE requires
 * subscriptions (and their callback) to be declared when the client is created, so each subscriber
 * owns its own connection; the returned cleanup function closes it.
 *
 * `signal` guards the setup race: if the client disconnected while `createClient` was still
 * connecting, we close the finished client right away instead of leaving it to be dropped by
 * glide's core (which logs a noisy `Internal client has been dropped` error).
 */
async function subscribeToChannel(
    channel: string,
    onMessage: (message: string) => void,
    signal?: AbortSignal,
): Promise<() => Promise<void>> {
    if (signal?.aborted) return async () => {}

    const handler = (msg: PubSubMsg): void => {
        if (String(msg.channel) !== channel) return
        onMessage(String(msg.message))
    }

    const sub = await GlideClient.createClient({
        ...getGlideClientConfig(),
        pubsubSubscriptions: {
            channelsAndPatterns: {
                [GlideClientConfiguration.PubSubChannelModes.Exact]: new Set([channel]),
            },
            callback: handler,
        },
    })

    // The client may have disconnected while the connection was being established; close now so the
    // freshly-created subscriber isn't leaked (and isn't dropped mid-handshake by glide's core).
    if (signal?.aborted) {
        sub.close()
        return async () => {}
    }

    return async () => {
        sub.close()
    }
}

/**
 * Subscribes to a single live session's events. Uses a dedicated connection so concurrent session
 * streams don't interfere with each other. The returned cleanup function closes the connection.
 */
export async function subscribeToQuizSession(
    sessionId: string,
    onEvent: (event: QuizEvent) => void,
    signal?: AbortSignal,
): Promise<() => Promise<void>> {
    const channel = sessionChannel(sessionId)
    return subscribeToChannel(
        channel,
        (message) => {
            try {
                onEvent(JSON.parse(message) as QuizEvent)
            } catch (e) {
                logger.error(new Error(`Failed to parse quiz event on ${channel}: ${message}`, { cause: e }))
            }
        },
        signal,
    )
}

export async function subscribeToLobby(onChange: () => void, signal?: AbortSignal): Promise<() => Promise<void>> {
    return subscribeToChannel(LOBBY_CHANNEL, () => onChange(), signal)
}
