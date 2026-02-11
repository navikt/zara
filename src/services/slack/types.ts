export type Types = {
    ok: boolean
    channel: string
    ts: string
    error?: string
}

export type SlackMessagePayload = {
    channel: string
    text: string
    blocks?: unknown[]
    thread_ts?: string
}
