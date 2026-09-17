type Send = (data: string) => void
type Cleanup = () => void | Promise<void>

/**
 * Builds a Server-Sent-Events `Response` from a `start` callback. The callback receives a `send`
 * that frames a string as one SSE `data:` event and an `AbortSignal` that fires when the client
 * disconnects, and returns a cleanup run when the client disconnects. Owns the stream lifecycle +
 * SSE headers so routes only provide their subscribe logic.
 *
 * The `signal` lets subscribe logic bail out of a still-in-flight connection setup: in dev
 * (Fast Refresh, prefetch, EventSource auto-reconnect) clients frequently disconnect mid-setup, and
 * a subscriber connection created after that point would be dropped by glide's core with a noisy
 * `Internal client has been dropped` error. Checking the signal lets callers close it cleanly.
 */
export function sseResponse(start: (send: Send, signal: AbortSignal) => Promise<Cleanup> | Cleanup): Response {
    const encoder = new TextEncoder()
    const abortController = new AbortController()
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
                cleanup = await start(send, abortController.signal)
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
            abortController.abort()
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
