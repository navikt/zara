import { bundledEnv, getServerEnv } from '@lib/env'
import { SlackPostMessagePayload, SlackResponsePayload, SlackUpdateMessagePayload } from '@services/slack/types'
import { spanServerAsync, squelchTracing } from '@lib/otel/server'

const SLACK_API = 'https://api.slack.com/api'

export async function slackChatPostMessage(payload: SlackPostMessagePayload): Promise<SlackResponsePayload> {
    const { zaraSlackBotToken } = getServerEnv()
    const response = await spanServerAsync('Slack API (postMessage)', () =>
        squelchTracing(() =>
            fetch(`${SLACK_API}/chat.postMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${zaraSlackBotToken}`,
                },
                body: JSON.stringify(payload),
            }),
        ),
    )

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to send message to Slack: ${response.statusText}: ${errorText}`)
    }

    const data: SlackResponsePayload = await response.json()
    if (data.ok) return data

    throw new Error(`Slack API error: ${data.error || 'Unknown error'}`)
}

export async function updateSlackMessage(
    channel: string,
    ts: string,
    payload: SlackUpdateMessagePayload,
): Promise<SlackResponsePayload> {
    const { zaraSlackBotToken } = getServerEnv()
    const response = await spanServerAsync('Slack API (update)', () =>
        squelchTracing(() =>
            fetch(`${SLACK_API}/chat.update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${zaraSlackBotToken}`,
                },
                body: JSON.stringify({ ...payload, channel, ts }),
            }),
        ),
    )

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to send message to Slack: ${response.statusText}: ${errorText}`)
    }

    const data: SlackResponsePayload = await response.json()
    if (data.ok) return data

    throw new Error(`Slack API error: ${data.error || 'Unknown error'}`)
}

export function getFeedbackUrl(feedbackId: string, type: 'ansatt' | 'intern'): string {
    switch (bundledEnv.runtimeEnv) {
        case 'local':
            return `http://localhost:3005/syk-inn/tilbakemeldinger/${feedbackId}`
        case 'prod-gcp':
            return `https://zara.${type}.nav.no/syk-inn/tilbakemeldinger/${feedbackId}`
        case 'dev-gcp':
            return `https://zara.${type}.dev.nav.no/syk-inn/tilbakemeldinger/${feedbackId}`
    }
}

export function createPermalink(channelId: string, ts: string): string {
    return `${createChannelPermalink(channelId)}/p${ts.replace('.', '')}`
}

export function createChannelPermalink(channelId: string): string {
    return `https://nav-it.slack.com/archives/${channelId}`
}
