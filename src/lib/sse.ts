type Send = (data: string) => void
type Cleanup = () => void | Promise<void>

/**
 * Builds a Server-Sent-Events `Response` from a `start` callback. The callback receives a `send`
 * that frames a string as one SSE `data:` event and returns a cleanup run when the client
 * disconnects. Owns the stream lifecycle + SSE headers so routes only provide their subscribe logic.
 */
export function sseResponse(start: (send: Send) => Promise<Cleanup> | Cleanup): Response {
    const encoder = new TextEncoder()
    let closed = false
    let canceled = false
    let cleanup: Cleanup | undefined

    const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
            const send: Send = (data) => {
                if (closed) return
                try {
                    controller.enqueue(encoder.encode(`data: ${data}\n\n`))
                } catch {
                    closed = true
                }
            }
            try {
                cleanup = await start(send)
            } catch (e) {
                closed = true
                controller.error(e)
                return
            }
            // If the client disconnected while `start` was still subscribing, cancel() ran before
            // `cleanup` existed (a no-op) — run it now so the subscriber connection isn't leaked.
            if (canceled) void cleanup()
        },
        cancel() {
            canceled = true
            closed = true
            void cleanup?.()
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
