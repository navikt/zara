import { subscribeToFeedbackChannels } from '@navikt/syk-zara/admin'

import { validateUserSession } from '@services/auth/auth'
import { subscriberValkeyClient } from '@services/valkey/production-valkey'

export async function GET(
    _: Request,
    { params }: RouteContext<'/syk-inn/tilbakemeldinger/[tilbakemeldingsId]/live'>,
): Promise<Response> {
    const { tilbakemeldingsId } = await params
    await validateUserSession()
    const encoder = new TextEncoder()

    let closed = false
    let cleanSub: () => Promise<void>

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

            const subValkey = subscriberValkeyClient()
            cleanSub = await subscribeToFeedbackChannels(subValkey, {
                deleted: async (id) => {
                    if (id !== tilbakemeldingsId) return

                    send(JSON.stringify({ type: 'deleted', id: id }))
                },
                updated: async (id) => {
                    if (id !== tilbakemeldingsId) return

                    send(JSON.stringify({ type: 'updated', id: id }))
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
