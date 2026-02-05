import { validateUserSession } from '@services/auth/auth'
import { subscriberValkey } from '@services/valkey/production-valkey'
import { getFeedbackClient } from '@services/feedback/feedback-client'

export async function GET(): Promise<Response> {
    await validateUserSession()
    const encoder = new TextEncoder()

    let closed = false
    let closeValkey: () => void

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

            const subValkey = subscriberValkey()
            await subValkey.subscribe('channel:new-feedback')

            const onNewMessage = async (channel: string, message: string): Promise<void> => {
                if (channel === 'channel:new-feedback') {
                    const client = getFeedbackClient()
                    const newFeedback = await client.byId(message)
                    if (!newFeedback) return

                    send(JSON.stringify(newFeedback))
                }
            }

            subValkey.on('message', onNewMessage)

            closeValkey = () => {
                subValkey.unsubscribe()
                subValkey.removeListener('message', onNewMessage)
            }
        },

        cancel() {
            closeValkey()
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
