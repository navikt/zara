import { pgClient } from '@services/db/postgres/production-pg'
import { validateUserSession } from '@services/auth/auth'
import { KontorUser, WeekSchedule } from '@services/team-office/types'

export async function getMyself(): Promise<{ unregistered: true } | KontorUser> {
    const session = await validateUserSession()
    const client = await pgClient()

    const result = await client.query<KontorUser>('SELECT * FROM users WHERE user_id = $1', [session.userId])

    if (result.rows.length === 0) {
        return { unregistered: true }
    }

    return result.rows[0]
}

export async function getMyWeek(week: number): Promise<WeekSchedule | null> {
    const session = await validateUserSession()
    const client = await pgClient()

    const result = await client.query<WeekSchedule>(
        `SELECT mon, tue, wed, thu, fri
         FROM week_schedule ws
         JOIN users u ON u.id = ws.user_id
         WHERE u.user_id = $1
           AND ws.week_number = $2
           AND ws.week_year = EXTRACT(ISOYEAR FROM CURRENT_DATE)`,
        [session.userId, week],
    )

    return result.rows[0] ?? null
}

export async function getTeam(): Promise<KontorUser[]> {
    await validateUserSession()
    const client = await pgClient()

    const result = await client.query<KontorUser>('SELECT * FROM users')

    return result.rows
}
