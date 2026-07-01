import { Feedback } from '@navikt/syk-zara/feedback'

import { getServerEnv } from '#lib/env'
import { User } from '#services/auth/user'
import { createFeedbackHeader } from '#services/slack/blocks'
import { createPermalink, getFeedbackUrl, slackChatPostMessage } from '#services/slack/utils'

export async function notifySlack(feedback: Feedback, byWho: User): Promise<{ postLink: string }> {
    const { zaraSlackChannelId } = getServerEnv()
    const ansattUrl = getFeedbackUrl(feedback.id, 'ansatt')

    const redactedMessage = redactMessageForSlack(feedback.message)

    const data = await slackChatPostMessage({
        channel: zaraSlackChannelId,
        text: `Ny tilbakemelding delt av ${byWho.name}`,
        blocks: [
            createFeedbackHeader(feedback),
            {
                type: 'section',
                text: { type: 'mrkdwn', text: `*📝 Melding:*\n> ${redactedMessage}` },
            },
            { type: 'divider' },
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `👤 *Fra:* ${feedback.name}\n📤 *Delt av:* ${byWho.name}\n💻 *System:* ${feedback.metaSystem}\n\n<${ansattUrl}|Se i Zara →>`,
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
    })

    // Let's start the thread so people remember to use threads.
    await slackChatPostMessage({
        channel: zaraSlackChannelId,
        thread_ts: data.ts,
        text: ':thread: Kjør diskusjon! :thread:',
    })

    return {
        postLink: createPermalink(data.channel, data.ts),
    }
}

const redactedVariants = ['█████████', '███████', '██████████████']

function redactMessageForSlack(message: string): string {
    const lines = message.split('\n')
    return lines
        .map((line, lineIndex) =>
            line
                .split(' ')
                .map((word, wordIndex) =>
                    word === '<redacted>' ? redactedVariants[(lineIndex + wordIndex) % redactedVariants.length] : word,
                )
                .join(' '),
        )
        .join('\n')
}
