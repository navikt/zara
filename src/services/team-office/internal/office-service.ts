import { getISOWeekYear } from 'date-fns'

import { pgClient } from '#services/db/postgres/production-pg'
import { DefaultWeekSchedule, OfficeUser } from '#services/team-office/common/types'

const days = ['mon', 'tue', 'wed', 'thu', 'fri']

export async function getUserByNavIdent(navIdent: string): Promise<OfficeUser | null> {
    const client = await pgClient()
    const result = await client.query<OfficeUser>('SELECT * FROM users WHERE nav_ident ILIKE $1', [navIdent])

    if (result.rows.length === 0) return null
    return result.rows[0]
}

export async function getUsersWeek(
    userId: string,
    week: number,
): Promise<Omit<DefaultWeekSchedule, 'isDefault'> | null> {
    const client = await pgClient()
    const result = await client.query<Omit<DefaultWeekSchedule, 'isDefault'>>(
        `SELECT mon, tue, wed, thu, fri
         FROM week_schedule ws
         JOIN users u ON u.id = ws.user_id
         WHERE u.user_id = $1
           AND ws.week_number = $2
           AND ws.week_year = EXTRACT(ISOYEAR FROM CURRENT_DATE)`,
        [userId, week],
    )

    return result.rows[0] ?? null
}

/**
 * Updates or creates the users toggles for this week. Given that no-changes = no entry, this can safely be used
 * regardless of whether or not the user already has changes. However, you must provide all the days for the user.
 */
export async function setAllDays(
    userUuid: string,
    week: number,
    // Zero-indexed, 0 = monday, etc
    daysOn: number[],
): Promise<void> {
    const weekYear = getISOWeekYear(new Date())
    const values: boolean[] = days.map((_, i) => daysOn.includes(i))

    const client = await pgClient()
    await client.query(
        `INSERT INTO week_schedule (user_id, week_number, week_year, mon, tue, wed, thu, fri)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (user_id, week_number, week_year)
         DO UPDATE SET mon = EXCLUDED.mon, tue = EXCLUDED.tue, wed = EXCLUDED.wed, thu = EXCLUDED.thu, fri = EXCLUDED.fri`,
        [userUuid, week, weekYear, ...values],
    )
}
