import { Feedback } from '@navikt/syk-zara'

import { getServerEnv } from '@lib/env'
import { spanServerAsync, squelchTracing } from '@lib/otel/server'
import { User } from '@services/auth/user'
import { getFeedbackUrl, slackChatPostMessage } from '@services/slack/utils'

export async function notifySlack(feedback: Feedback, byWho: User): Promise<{ postLink: string }> {
    const { zaraSlackBotToken, zaraSlackChannelId } = getServerEnv()
    const internalUrl = getFeedbackUrl(feedback.id, 'internal')
    const ansattUrl = getFeedbackUrl(feedback.id, 'ansatt')

    const sentimentText = feedback.sentiment ? ` - ${feedback.sentiment}/5 ⭐` : ''

    const data = await spanServerAsync('Slack API (fetch)', () =>
        squelchTracing(() =>
            slackChatPostMessage(zaraSlackBotToken, {
                channel: zaraSlackChannelId,
                text: `Ny tilbakemelding delt av ${byWho.name}`,
                blocks: [
                    {
                        type: 'header',
                        text: {
                            type: 'plain_text',
                            text: `${categoryEmoji[feedback.category]} ${feedback.category}${sentimentText}`,
                            emoji: true,
                        },
                    },
                    {
                        type: 'section',
                        text: { type: 'mrkdwn', text: `*📝 Melding:*\n> ${feedback.message}` },
                    },
                    { type: 'divider' },
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: `👤 *Fra:* ${feedback.name}\n📤 *Delt av:* ${byWho.name}\n💻 *System:* ${feedback.metaSystem}\n\n<${internalUrl}|Åpne i Zara (internal) →> | <${ansattUrl}|Åpne i Zara (ansatt) →>`,
                        },
                    },
                    { type: 'divider' },
                    {
                        type: 'context',
                        elements: [
                            {
                                type: 'mrkdwn',
                                text: `Opprettet ${new Date(feedback.timestamp).toLocaleDateString('nb-NO')} | ID: ${feedback.id}`,
                            },
                        ],
                    },
                ],
            }),
        ),
    )

    // Let's start the thread so people remember to use threads.
    await spanServerAsync('Slack API thread reply (fetch)', () =>
        squelchTracing(() =>
            slackChatPostMessage(zaraSlackBotToken, {
                channel: zaraSlackChannelId,
                thread_ts: data.ts,
                text: ':thread: Kjør diskusjon! :thread:',
            }),
        ),
    )

    return {
        postLink: createPermalink(data.channel, data.ts),
    }
}

const categoryEmoji = {
    FEIL: '🐛',
    FORSLAG: '💡',
    ANNET: '💬',
}

export function createPermalink(channelId: string, ts: string): string {
    return `${createChannelPermalink(channelId)}/p${ts.replace('.', '')}`
}

export function createChannelPermalink(channelId: string): string {
    return `https://nav-it.slack.com/archives/${channelId}`
}
