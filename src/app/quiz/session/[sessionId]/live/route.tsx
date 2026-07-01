import { sseResponse } from '#lib/sse'
import { validateUserSession } from '#services/auth/auth'
import { subscribeToQuizSession } from '#services/quiz/quiz-pubsub-client'
import { getClientState } from '#services/quiz/quiz-session-service'

export async function GET(_: Request, { params }: RouteContext<'/quiz/session/[sessionId]/live'>): Promise<Response> {
    await validateUserSession('TEAM_MEMBER')
    const { sessionId } = await params

    return sseResponse(async (send) => {
        // Send the current state immediately so a late-joining client renders without waiting.
        const initial = await getClientState(sessionId)
        if (initial) send(JSON.stringify({ type: 'state', state: initial }))

        return subscribeToQuizSession(sessionId, (event) => send(JSON.stringify(event)))
    })
}
