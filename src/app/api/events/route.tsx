import { NextRequest } from 'next/server'

import { liveService } from '@services/live-service/users'
import { Pages } from '@services/live-service/pages'
import { validateUserSession } from '@services/auth/auth'

export async function GET(request: NextRequest): Promise<Response> {
    const pageToGetEventsFor = request.nextUrl.searchParams.get('page')
    if (!pageToGetEventsFor) {
        return new Response('Missing page parameter', { status: 400 })
    }

    await validateUserSession()
    const encoder = new TextEncoder()

    let closed = false
    let closeLiveService: () => void

    const stream = new ReadableStream<Uint8Array>({
        start(controller) {
            const send = (data: string): void => {
                if (closed) return
                try {
                    controller.enqueue(encoder.encode(`data: ${data}\n\n`))
                } catch {
                    closed = true
                }
            }

            closeLiveService = liveService.seeUsersOnPage(pageToGetEventsFor as Pages, (users) => {
                send(JSON.stringify(users))
            })
        },

        cancel() {
            closeLiveService()
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
