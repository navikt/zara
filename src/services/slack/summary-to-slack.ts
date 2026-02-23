import * as R from 'remeda'
import { ContactableUserFeedback } from '@navikt/syk-zara/feedback'
import { logger } from '@navikt/next-logger'
import { isAfter, startOfYesterday } from 'date-fns'

import { bundledEnv, getServerEnv } from '@lib/env'
import { spanServerAsync } from '@lib/otel/server'
import { createPermalink, slackChatPostMessage } from '@services/slack/utils'
import { getFeedbackClient } from '@services/feedback/feedback-client'

const angryZaraPublicUrl = 'https://cdn.nav.no/tsm/zara/_next/static/media/sara-mad.1858972f.webp'

export async function postDailySummary(): Promise<{ postLink: string | null }> {
    return spanServerAsync('Post daily summary to Slack', async () => {
        const { zaraSlackChannelId } = getServerEnv()
        const { unverifiedCount, unrespondedCount, totalCount, yesterdayCount } = await getDailySummaryStats()
        const ansattUrl = getZaraUrl('ansatt')

        if (unrespondedCount === 0 && unverifiedCount === 0) {
            logger.info('Skipping daily summary, everything is clear!')
            return { postLink: null }
        }

        const lines: string[] = []
        if (unverifiedCount > 0) {
            lines.push(
                `🔍 *${unverifiedCount}* tilbakemelding${unverifiedCount !== 1 ? 'er' : ''} venter på innholdsverifisering`,
            )
        }
        if (unrespondedCount > 0) {
            lines.push(`📬 *${unrespondedCount}* henvendelse${unrespondedCount !== 1 ? 'r' : ''} venter på svar`)
        }

        const blocks: unknown[] = [
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*📋 Daglig oppzummering*\n\n${lines.join('\n')}`,
                },
                accessory: {
                    type: 'image',
                    image_url: angryZaraPublicUrl,
                    alt_text: 'Sint Zara',
                },
            },
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `<${ansattUrl}|Zara →>`,
                },
            },
            {
                type: 'context',
                elements: [
                    {
                        type: 'mrkdwn',
                        text: `I Zara har vi mottatt *${totalCount}* tilbakemeldinger totalt. I går mottok vi *${yesterdayCount}* nye tilbakemelding(er).`,
                    },
                ],
            },
        ]

        const data = await slackChatPostMessage({
            channel: zaraSlackChannelId,
            text: `Daglig oppsummering av tilbakemeldinger`,
            blocks,
        })

        return { postLink: createPermalink(data.channel, data.ts) }
    })
}

async function getDailySummaryStats(): Promise<{
    unverifiedCount: number
    unrespondedCount: number
    yesterdayCount: number
    totalCount: number
}> {
    const client = getFeedbackClient()

    const all = await client.all()

    const unverifiedCount: number = all.filter((it) => it.verifiedContentAt == null).length
    const unrespondedCount: number = R.pipe(
        all,
        R.filter((it): it is ContactableUserFeedback => it.type === 'CONTACTABLE' && it.contactType !== 'NONE'),
        R.filter((it) => it.contactedAt != null),
        R.length(),
    )

    const yesterday = startOfYesterday()
    const yesterdayCount: number = all.filter((it) => isAfter(it.timestamp, yesterday)).length

    return { unverifiedCount, unrespondedCount, yesterdayCount, totalCount: all.length }
}

export function getZaraUrl(type: 'ansatt' | 'intern'): string {
    switch (bundledEnv.runtimeEnv) {
        case 'local':
            return `http://localhost:3005/syk-inn/tilbakemeldinger`
        case 'prod-gcp':
            return `https://zara.${type}.nav.no/syk-inn/tilbakemeldinger`
        case 'dev-gcp':
            return `https://zara.${type}.dev.nav.no/syk-inn/tilbakemeldinger`
    }
}
