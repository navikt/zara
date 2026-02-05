import { liveService } from '@services/live-service/users'

export async function GET(): Promise<Response> {
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

            closeLiveService = liveService.seeUsersOnPage('/syk-inn/tilbakemeldinger', (users) => {
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
