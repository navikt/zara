import { bundledEnv } from '@lib/env'
import { SlackMessagePayload, Types } from '@services/slack/types'

export function getFeedbackUrl(feedbackId: string, type: 'ansatt' | 'internal'): string {
    switch (bundledEnv.runtimeEnv) {
        case 'local':
            return `http://localhost:3005/syk-inn/tilbakemeldinger/${feedbackId}`
        case 'prod-gcp':
            return `https://zara.${type}.nav.no/syk-inn/tilbakemeldinger/${feedbackId}`
        case 'dev-gcp':
            return `https://zara.${type}.dev.nav.no/syk-inn/tilbakemeldinger/${feedbackId}`
    }
}

export async function slackChatPostMessage(botToken: string, payload: SlackMessagePayload): Promise<Types> {
    const response = await fetch('https://api.slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${botToken}`,
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to send message to Slack: ${response.statusText}: ${errorText}`)
    }

    const data: Types = await response.json()
    if (data.ok) return data

    throw new Error(`Slack API error: ${data.error || 'Unknown error'}`)
}
