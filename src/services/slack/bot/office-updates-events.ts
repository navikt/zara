import type { BlockAction } from '@slack/bolt/dist/types/actions/block-action'
import * as R from 'remeda'
import { getISODay, getISOWeek, isToday } from 'date-fns'
import { TZDate } from '@date-fns/tz'

import { raise } from '@lib/ts'
import { getUserByNavIdent, getUsersWeek, setAllDays } from '@services/team-office/internal/office-service'
import { getKontorUrl, updateTodaysOfficeSummaryIfNeeded } from '@services/slack/office-to-slack'
import { toDefaultSchedule } from '@services/team-office/common/team-office-utils'

import { App } from './bot'

export const OfficeUpdatesActions = {
    KommerLaell: 'office-action-register-today',
    KommerIkke: 'office-action-register-not-coming-today',
}

export function configureOfficeUpdatesListeners(app: App): void {
    app.action(OfficeUpdatesActions.KommerLaell, async ({ ack, body, client }) => {
        if (body.type !== 'block_actions') {
            await ack()
            return
        }

        if (isParentMessageOld(body)) {
            await handleStaleAction(client.chat, body)
            await ack()
            return
        }

        const currentNavIdent = navIdentFromAction(body)
        const user = await getUserByNavIdent(currentNavIdent)

        if (user == null) {
            await handleMissingUser(client.chat, body, currentNavIdent)
            await ack()
            return
        }

        const { thisWeek, thisDay } = getNow()
        const usersWeek = (await getUsersWeek(user.id, thisWeek)) ?? toDefaultSchedule(user.default_loc)
        const enabledDays: number[] = R.pipe(
            [
                thisDay,
                usersWeek.mon ? 0 : null,
                usersWeek.tue ? 1 : null,
                usersWeek.wed ? 2 : null,
                usersWeek.thu ? 3 : null,
                usersWeek.fri ? 4 : null,
            ],
            R.filter(R.isNonNull),
            R.unique(),
        )

        await setAllDays(user.id, thisWeek, enabledDays)
        await updateTodaysOfficeSummaryIfNeeded()
        await ack()
    })

    app.action(OfficeUpdatesActions.KommerIkke, async ({ ack, body, client }) => {
        if (body.type !== 'block_actions') {
            await ack()
            return
        }

        if (isParentMessageOld(body)) {
            await handleStaleAction(client.chat, body)
            await ack()
            return
        }

        const currentNavIdent = navIdentFromAction(body)
        const user = await getUserByNavIdent(currentNavIdent)

        if (user == null) {
            await handleMissingUser(client.chat, body, currentNavIdent)
            await ack()
            return
        }

        const { thisWeek, thisDay } = getNow()
        const usersWeek = (await getUsersWeek(user.user_id, thisWeek)) ?? toDefaultSchedule(user.default_loc)
        const enabledDays: number[] = R.pipe(
            [
                usersWeek.mon ? 0 : null,
                usersWeek.tue ? 1 : null,
                usersWeek.wed ? 2 : null,
                usersWeek.thu ? 3 : null,
                usersWeek.fri ? 4 : null,
            ],
            R.filter(R.isNonNull),
            R.filter((it) => it !== thisDay),
            R.unique(),
        )

        await setAllDays(user.id, thisWeek, enabledDays)
        await updateTodaysOfficeSummaryIfNeeded()
        await ack()
    })
}

/**
 * In the nav-it workspace, the 'name' in BlockAction bodies is the 'nav ident' which we can use to correlate the user
 * with the normal user database.
 *
 * This should never not be present.
 */
function navIdentFromAction(body: BlockAction): string {
    return body.user.name ?? raise(`User with slack_id ${body.user.id} has no 'nav ident'-name.`)
}

function isParentMessageOld(body: BlockAction): boolean {
    const slackTs = body.message?.ts ?? null
    if (slackTs == null) return false

    const tzDate = new TZDate(+slackTs * 1000, 'Europe/Oslo')
    return !isToday(tzDate)
}

function getNow(): {
    // ISO week number
    thisWeek: number
    // Zero-indexed day number
    thisDay: number
} {
    const now = new Date()
    const thisWeek = getISOWeek(now)
    const thisDay = getISODay(now) - 1

    return { thisWeek, thisDay }
}

async function handleStaleAction(chat: App['client']['chat'], body: BlockAction): Promise<void> {
    await chat.postEphemeral({
        channel: body.channel?.id ?? '',
        user: body.user.id,
        text: `Du kan ikke endre status på tidligere dager :zara:`,
    })
}

async function handleMissingUser(
    chat: App['client']['chat'],
    body: BlockAction,
    currentNavIdent: string,
): Promise<void> {
    await chat.postEphemeral({
        channel: body.channel?.id ?? '',
        user: body.user.id,
        text: `Fant ingen bruker med nav ident ${currentNavIdent}. Besøk <${getKontorUrl()}/settings|Zara innstillinger →> èn gang så blir det fikset! :zara-happy:`,
    })
}
