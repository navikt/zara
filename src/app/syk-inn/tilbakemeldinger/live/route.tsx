import { subscribeToFeedbackChannels } from '@navikt/syk-zara/feedback/admin'

import { validateUserSession } from '#services/auth/auth'
import { getGlideClientConfig } from '#services/db/valkey/production-valkey'
import { getFeedbackClient } from '#services/feedback/feedback-client'

export async function GET(): Promise<Response> {
    await validateUserSession('TILBAKEMELDINGER')
    const encoder = new TextEncoder()

    let closed = false
    let cleanSub: () => void

    const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
            const send = (data: string): void => {
                if (closed) return
                try {
                    controller.enqueue(encoder.encode(`data: ${data}\n\n`))
                } catch {
                    closed = true
                }
            }

            cleanSub = await subscribeToFeedbackChannels(getGlideClientConfig(), {
                new: async (id) => {
                    const client = await getFeedbackClient()
                    const newFeedback = await client.byId(id)
                    if (!newFeedback) return

                    send(JSON.stringify(newFeedback))
                },
            })
        },

        cancel() {
            cleanSub()
            closed = true
        },
    })

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
        },
    })
}
