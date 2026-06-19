import { sseResponse } from '@lib/sse'
import { validateUserSession } from '@services/auth/auth'
import { listActiveSessions } from '@services/quiz/quiz-session-service'
import { subscribeToLobby } from '@services/quiz/quiz-pubsub-client'

export async function GET(): Promise<Response> {
    await validateUserSession('TEAM_MEMBER')

    return sseResponse(async (send) => {
        const sendSessions = async (): Promise<void> =>
            send(JSON.stringify({ type: 'sessions', sessions: await listActiveSessions() }))

        // Initial snapshot so the client has the live list without waiting for the first change.
        await sendSessions()
        return subscribeToLobby(() => {
            void sendSessions()
        })
    })
}
