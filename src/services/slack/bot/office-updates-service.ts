import type { BlockAction } from '@slack/bolt/dist/types/actions/block-action'
import * as R from 'remeda'
import { getISODay, getISOWeek } from 'date-fns'

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
    app.action(OfficeUpdatesActions.KommerLaell, async (action) => {
        if (action.body.type !== 'block_actions') {
            await action.ack()
            return
        }

        const currentNavIdent = navIdentFromAction(action.body)
        const user = await getUserByNavIdent(currentNavIdent)

        if (user == null) {
            await action.ack()
            await action.client.chat.postEphemeral({
                channel: action.body.channel?.id ?? '',
                user: action.body.user.id,
                text: `Fant ingen bruker med nav ident ${currentNavIdent}. Du kan fikse dette ved å besøke <${getKontorUrl()}/settings|Zara innstillinger →>`,
            })
            return
        }

        await action.ack()

        const now = new Date()
        const thisWeek = getISOWeek(now)
        const thisDay = getISODay(now) - 1

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
    })

    app.action(OfficeUpdatesActions.KommerIkke, async (action) => {
        if (action.body.type !== 'block_actions') {
            await action.ack()
            return
        }

        const currentNavIdent = navIdentFromAction(action.body)
        const user = await getUserByNavIdent(currentNavIdent)

        if (user == null) {
            await action.ack()
            await action.client.chat.postEphemeral({
                channel: action.body.channel?.id ?? '',
                user: action.body.user.id,
                text: `Fant ingen bruker med nav ident ${currentNavIdent}. Du kan fikse dette ved å besøke <${getKontorUrl()}/settings|Zara innstillinger →>`,
            })
            return
        }

        await action.ack()

        const now = new Date()
        const thisWeek = getISOWeek(now)
        const thisDay = getISODay(now) - 1

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
