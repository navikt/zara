export type SlackResponsePayload = {
    ok: boolean
    channel: string
    ts: string
    error?: string
}

export type SlackPostMessagePayload = {
    channel: string
    text: string
    blocks?: unknown[]
    thread_ts?: string
}

export type SlackUpdateMessagePayload = {
    text: string
    blocks?: unknown[]
}
