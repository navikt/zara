import { logger } from '@navikt/next-logger'
import { getISOWeek, getISOWeekYear } from 'date-fns'

import { getZeroIndexedWeekday, toReadableFullDate } from '#lib/date'
import { bundledEnv, getServerEnv } from '#lib/env'
import { isWeekday } from '#services/team-office/common/day-utils'

import { OfficeUser } from '../team-office/common/types'
import { existingCronPost, getOfficeSnapshot, insertDailyPost } from '../team-office/internal/office-cron-service'

import { OfficeUpdatesActions } from './bot/office-updates-events'
import { createPermalink, slackChatPostMessage, updateSlackMessage } from './utils'

export async function postDailyOfficeSummary(): Promise<{
    postLink: string | null
}> {
    const { tsmAwaySlackChannelId } = getServerEnv()

    const now = new Date()
    const currentYear = getISOWeekYear(now)
    const currentWeek = getISOWeek(now)
    const day = getZeroIndexedWeekday(now)

    const { office } = await getOfficeSnapshot(currentYear, currentWeek, day)

    if (!isWeekday(day)) {
        logger.info("Not a working day, skipping today's office post.")
        return { postLink: null }
    }

    const hasAlreadyPostedToday = await existingCronPost(currentWeek, currentYear, day)
    if (hasAlreadyPostedToday) {
        logger.warn('Already posted office summary for today, skipping...')
        return { postLink: null }
    }

    const data = await slackChatPostMessage({
        channel: tsmAwaySlackChannelId,
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
    const day = getZeroIndexedWeekday(now)

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
    const { tsmAwaySlackChannelId } = getServerEnv()

    const data = await slackChatPostMessage({
        channel: tsmAwaySlackChannelId,
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
                    text: `Er du remote ansatt og kommer til Oslo neste uke? Eller kontor-ansatt som ikke kan komme på kontoret tirsdag eller onsdag, eller skal andre dager?\n\nHusk å oppdatere kontorplanen din i Zara!\n\n<${getKontorUrl()}|Zara →>`,
                },
            },
        ],
    })

    return { postLink: createPermalink(data.channel, data.ts) }
}

function buildOfficeBlocks(office: OfficeUser[]): unknown[] {
    const dateLabel = toReadableFullDate(new Date())
    const ansattUrl = getKontorUrl()
    const officeList =
        office.length > 0
            ? office
                  .map((u) => {
                      const shouldSparkle = u.default_loc !== 'office'
                      return `• ${shouldSparkle ? ':sparkles: ' : ''}${u.name}${shouldSparkle ? ' :sparkles:' : ''}`
                  })
                  .join('\n')
            : null

    return [
        {
            type: 'header',
            text: { type: 'plain_text', text: `:zara-happy: Hvem kommer på FA1 ${dateLabel}?`, emoji: true },
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
            type: 'actions',
            elements: [
                {
                    type: 'button',
                    text: { type: 'plain_text', text: 'Kommer læll :zara-happy:', emoji: true },
                    action_id: OfficeUpdatesActions.KommerLaell,
                },
                {
                    type: 'button',
                    text: { type: 'plain_text', text: 'Kan ikke i dag :zara:', emoji: true },
                    action_id: OfficeUpdatesActions.KommerIkke,
                },
            ],
        },
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `Endre andre dager?  <${ansattUrl}|Åpne Zara →>`,
            },
        },
    ]
}

export function getKontorUrl(): string {
    switch (bundledEnv.runtimeEnv) {
        case 'local':
            return `http://localhost:3005/team/kontor`
        case 'prod-gcp':
            return `https://zara.ansatt.nav.no/team/kontor`
        case 'dev-gcp':
            return `https://zara.ansatt.dev.nav.no/team/kontor`
    }
}
