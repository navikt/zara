import { getISOWeek, getISOWeekYear, getISODay } from 'date-fns'
import { logger } from '@navikt/next-logger'

import { bundledEnv, getServerEnv } from '@lib/env'
import { createPermalink, slackChatPostMessage, updateSlackMessage } from '@services/slack/utils'
import {
    getOfficeSnapshot,
    existingCronPost,
    insertDailyPost,
    isTodayOfficeDay,
} from '@services/team-office/team-office-service'
import { toReadableFullDate } from '@lib/date'
import { OfficeUser } from '@services/team-office/types'

export async function postDailyOfficeSummary(): Promise<{
    postLink: string | null
}> {
    const { zaraSlackChannelId } = getServerEnv()

    const now = new Date()
    const currentYear = getISOWeekYear(now)
    const currentWeek = getISOWeek(now)
    const day = getISODay(now) - 1

    const { office } = await getOfficeSnapshot(currentYear, currentWeek, day)

    if (!isTodayOfficeDay(day) && office.length === 0) {
        logger.info("Not a office day and nobody is coming, don't post anything")
        return { postLink: null }
    }

    const hasAlreadyPostedToday = await existingCronPost(currentWeek, currentYear, day)
    if (hasAlreadyPostedToday) {
        logger.warn('Already posted office summary for today, skipping...')
        return { postLink: null }
    }

    const data = await slackChatPostMessage({
        channel: zaraSlackChannelId,
        text: `Hvem skal på FA1 i dag? 🏢`,
        blocks: buildOfficeBlocks(office),
    })

    await insertDailyPost(currentWeek, currentYear, day, data.channel, data.ts)

    return {
        postLink: createPermalink(data.channel, data.ts),
    }
}

export async function updateTodaysOfficeSummaryIfNeeded(): Promise<void> {
    const now = new Date()
    const currentYear = getISOWeekYear(now)
    const currentWeek = getISOWeek(now)
    const day = getISODay(now) - 1

    const exists = await existingCronPost(currentWeek, currentYear, day)
    if (!exists) {
        logger.info("Today's office summary post does not exist, skipping update.")
        return
    }

    const { office } = await getOfficeSnapshot(currentYear, currentWeek, day)

    await updateSlackMessage(exists.channel_id, exists.message_ts, {
        text: `Hvem skal på FA1 i dag? 🏢`,
        blocks: buildOfficeBlocks(office),
    })
}

export async function postWeeklyRememberToUpdatePost(): Promise<{ postLink: string }> {
    const { zaraSlackChannelId } = getServerEnv()

    const data = await slackChatPostMessage({
        channel: zaraSlackChannelId,
        text: `Husk å oppdatere kontorplanen for neste uke! 🏢`,
        blocks: [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: `:zara-happy: Snart helg! :zara-happy:`,
                    emoji: true,
                },
            },
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `Er du remote ansatt og kommer til Oslo neste uke? Eller kontor-ansatt som ikke kan komme på kontoret tirsdag eller onsdag, eller skal andre dager?\n\nHusk å oppdatere kontorplanen din i Zara!\n\n<${getKontorUrl('ansatt')}|Gå til Zara (ansatt) →> | <${getKontorUrl('intern')}|Gå til Zara (internal) →>`,
                },
            },
        ],
    })

    return { postLink: createPermalink(data.channel, data.ts) }
}

function buildOfficeBlocks(office: OfficeUser[]): unknown[] {
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
