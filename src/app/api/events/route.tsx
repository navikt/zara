import { NextRequest } from 'next/server'

import { validateUserSession } from '@services/auth/auth'
import { getFeedbackClient } from '@services/feedback/feedback-client'

export async function GET(request: NextRequest): Promise<Response> {
    const pageToGetEventsFor = request.nextUrl.searchParams.get('page')
    if (!pageToGetEventsFor) {
        return new Response('Missing page parameter', { status: 400 })
    }

    await validateUserSession()
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

            const [, pubsub] = getFeedbackClient()
            cleanSub = await pubsub.sub({
                activity: async (activity) => {
                    if (activity.page !== pageToGetEventsFor) return

                    send(JSON.stringify(activity))
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
