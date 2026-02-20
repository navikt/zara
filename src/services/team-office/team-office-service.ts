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

const DEFAULT_OFFICE_DAYS = [1, 2]
const DAY_COLS = ['mon', 'tue', 'wed', 'thu', 'fri'] as const

export async function getOfficeTodaySnapshot(
    year: number,
    week: number,
    day: number,
): Promise<{ office: KontorUser[]; remote: KontorUser[] }> {
    if (day < 0) throw new Error('Day cannot be negative')

    /// Saturday and sunday
    if (day > 4) return { office: [], remote: [] }

    const client = await pgClient()
    const dayCol = DAY_COLS[day]

    const result = await client.query<KontorUser & { day_override: boolean | null }>(
        `SELECT u.*, ws.${dayCol} AS day_override
         FROM users u
         LEFT JOIN week_schedule ws ON ws.user_id = u.id
           AND ws.week_number = $1
           AND ws.week_year = $2`,
        [week, year],
    )

    const isInOffice = (r: KontorUser & { day_override: boolean | null }): boolean => {
        if (r.day_override !== null) return r.day_override
        return r.default_loc === 'office' && DEFAULT_OFFICE_DAYS.includes(day)
    }

    return {
        office: result.rows.filter(isInOffice),
        remote: result.rows.filter((r) => !isInOffice(r)),
    }
}

export async function insertDailyPost(
    week: number,
    year: number,
    day: number,
    channelId: string,
    messageTs: string,
): Promise<void> {
    const client = await pgClient()
    await client.query(
        `INSERT INTO slack_cron_posts (week_number, week_year, day, channel_id, message_ts)
         VALUES ($1, $2, $3, $4, $5)`,
        [week, year, day, channelId, messageTs],
    )
}

export async function hasPostedToday(week: number, year: number, day: number): Promise<boolean> {
    const client = await pgClient()
    const result = await client.query(
        `SELECT 1 FROM slack_cron_posts WHERE week_number = $1 AND week_year = $2 AND day = $3 LIMIT 1`,
        [week, year, day],
    )
    return result.rows.length > 0
}

export function isTodayOfficeDay(day: number): boolean {
    return DEFAULT_OFFICE_DAYS.includes(day)
}
