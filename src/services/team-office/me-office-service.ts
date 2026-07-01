import { logger } from '@navikt/next-logger'

import { validateUserSession } from '#services/auth/auth'
import { pgClient } from '#services/db/postgres/production-pg'
import { toDefaultSchedule } from '#services/team-office/common/team-office-utils'
import { DefaultWeekSchedule, Location, OfficeUser } from '#services/team-office/common/types'
import { getUsersWeek } from '#services/team-office/internal/office-service'

/**
 * Authorized: TEAM_MEMBER
 */
export async function getMyself(): Promise<{ unregistered: true } | OfficeUser> {
    const session = await validateUserSession('TEAM_MEMBER')
    const client = await pgClient()

    const result = await client.query<OfficeUser>('SELECT * FROM users WHERE user_id = $1', [session.userId])

    if (result.rows.length === 0) {
        return { unregistered: true }
    }

    const user = result.rows[0]
    if (user.nav_ident == null) {
        logger.info('Found user without nav_ident, fixing...')

        await client.query('UPDATE users SET nav_ident = $2 WHERE user_id = $1', [session.userId, session.navIdent])

        user.nav_ident = session.navIdent
    }

    return user
}

/**
 * Authorized: TEAM_MEMBER
 *
 * Gets users week, with fallback default values if week has no entry.
 */
export async function getMyWeek(week: number, myLocation: Location): Promise<DefaultWeekSchedule> {
    const session = await validateUserSession('TEAM_MEMBER')
    const schedule = await getUsersWeek(session.userId, week)

    if (schedule == null) return toDefaultSchedule(myLocation)
    return { ...schedule, isDefault: false }
}
