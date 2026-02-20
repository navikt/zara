import { getISOWeek, getISOWeekYear, getISODay } from 'date-fns'
import { logger } from '@navikt/next-logger'

import { bundledEnv, getServerEnv } from '@lib/env'
import { spanServerAsync, squelchTracing } from '@lib/otel/server'
import { createPermalink, slackChatPostMessage } from '@services/slack/utils'
import { getOfficeTodaySnapshot, isTodayOfficeDay } from '@services/team-office/team-office-service'
import { KontorUser } from '@services/team-office/types'
import { toReadableFullDate } from '@lib/date'

export async function postDailyOfficeSummary(): Promise<{
    postLink: string | null
}> {
    const { zaraSlackBotToken, zaraSlackChannelId } = getServerEnv()

    const now = new Date()
    const currentYear = getISOWeekYear(now)
    const currentWeek = getISOWeek(now)
    const day = getISODay(now) - 1

    const { office } = await getOfficeTodaySnapshot(currentYear, currentWeek, day)

    if (!isTodayOfficeDay(day) && office.length === 0) {
        logger.info("Not a office day and nobody is coming, don't post anything")
        return { postLink: null }
    }

    const data = await spanServerAsync('Slack API (fetch)', () =>
        squelchTracing(() =>
            slackChatPostMessage(zaraSlackBotToken, {
                channel: zaraSlackChannelId,
                text: `Hvem skal på FA1 i dag? 🏢`,
                blocks: buildOfficeBlocks(office),
            }),
        ),
    )

    return {
        postLink: createPermalink(data.channel, data.ts),
    }
}

function buildOfficeBlocks(office: KontorUser[]): unknown[] {
    const dateLabel = toReadableFullDate(new Date())
    const internalUrl = getKontorUrl('intern')
    const ansattUrl = getKontorUrl('ansatt')
    const officeList = office.length > 0 ? office.map((u) => `• ${u.name}`).join('\n') : null

    return [
        {
            type: 'header',
            text: { type: 'plain_text', text: `:zara-happy: Hvem skal på FA1 ${dateLabel}?`, emoji: true },
        },
        {
            type: 'section',
            fields: [
                {
                    type: 'mrkdwn',
                    text: officeList
                        ? `I dag skal *${office.length}* på kontoret\n\n${officeList}\n`
                        : `👻 Ingen skal på kontoret i dag 👻`,
                },
            ],
        },
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `Har planene endra seg?  <${ansattUrl}|Zara (ansatt) →> | <${internalUrl}|Zara (internal) →>`,
            },
        },
    ]
}

export function getKontorUrl(type: 'ansatt' | 'intern'): string {
    switch (bundledEnv.runtimeEnv) {
        case 'local':
            return `http://localhost:3005/team/kontor`
        case 'prod-gcp':
            return `https://zara.${type}.nav.no/team/kontor`
        case 'dev-gcp':
            return `https://zara.${type}.dev.nav.no/team/kontor`
    }
}
