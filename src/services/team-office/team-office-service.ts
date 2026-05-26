import * as R from 'remeda'

import { pgClient } from '@services/db/postgres/production-pg'
import { validateUserSession } from '@services/auth/auth'

import { OfficeUser, TeamWeek, WeekSchedule } from './common/types'
import { toDefaultSchedule } from './common/team-office-utils'

export async function getTeamWeek(week: number): Promise<TeamWeek> {
    await validateUserSession('TEAM_MEMBER')
    const client = await pgClient()

    const result = await client.query<OfficeUser & WeekSchedule>(
        `SELECT u.*, ws.mon, ws.tue, ws.wed, ws.thu, ws.fri
         FROM users u
         LEFT JOIN week_schedule ws ON ws.user_id = u.id
           AND ws.week_number = $1
           AND ws.week_year = EXTRACT(ISOYEAR FROM CURRENT_DATE)`,
        [week],
    )

    return result.rows.map((it) => ({
        user: R.pick(it, ['id', 'user_id', 'nav_ident', 'name', 'default_loc']),
        schedule: toDefaultSchedule(it.default_loc, it),
    }))
}

export async function getTeam(): Promise<OfficeUser[]> {
    await validateUserSession('TEAM_MEMBER')
    const client = await pgClient()

    const result = await client.query<OfficeUser>('SELECT * FROM users')

    return result.rows
}
