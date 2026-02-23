import * as R from 'remeda'

import { pgClient } from '@services/db/postgres/production-pg'
import { validateUserSession } from '@services/auth/auth'

import { CronPost, DefaultWeekSchedule, Location, OfficeUser, TeamWeek, WeekSchedule } from './types'
import { toDefaultSchedule } from './team-office-utils'

export async function getMyself(): Promise<{ unregistered: true } | OfficeUser> {
    const session = await validateUserSession()
    const client = await pgClient()

    const result = await client.query<OfficeUser>('SELECT * FROM users WHERE user_id = $1', [session.userId])

    if (result.rows.length === 0) {
        return { unregistered: true }
    }

    return result.rows[0]
}

/**
 * Gets users week, with fallback default values if week has no entry.
 */
export async function getMyWeek(week: number, myLocation: Location): Promise<DefaultWeekSchedule> {
    const session = await validateUserSession()
    const client = await pgClient()

    const result = await client.query<Omit<DefaultWeekSchedule, 'isDefault'>>(
        `SELECT mon, tue, wed, thu, fri
         FROM week_schedule ws
         JOIN users u ON u.id = ws.user_id
         WHERE u.user_id = $1
           AND ws.week_number = $2
           AND ws.week_year = EXTRACT(ISOYEAR FROM CURRENT_DATE)`,
        [session.userId, week],
    )

    const schedule = result.rows[0] ?? null
    if (schedule == null) return toDefaultSchedule(myLocation)

    return { ...schedule, isDefault: false }
}

export async function getTeamWeek(week: number): Promise<TeamWeek> {
    await validateUserSession()
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
        user: R.pick(it, ['id', 'user_id', 'name', 'default_loc']),
        schedule: toDefaultSchedule(it.default_loc, it),
    }))
}

export async function getTeam(): Promise<OfficeUser[]> {
    await validateUserSession()
    const client = await pgClient()

    const result = await client.query<OfficeUser>('SELECT * FROM users')

    return result.rows
}

const DEFAULT_OFFICE_DAYS = [1, 2]
const DAY_COLS = ['mon', 'tue', 'wed', 'thu', 'fri'] as const

export async function getOfficeSnapshot(year: number, week: number, day: number): Promise<{ office: OfficeUser[] }> {
    if (day < 0) throw new Error('Day cannot be negative')

    // Saturday and sunday
    if (day > 4) return { office: [] }

    const client = await pgClient()
    const dayCol = DAY_COLS[day]

    const result = await client.query<OfficeUser & { day_override: boolean | null }>(
        `SELECT u.*, ws.${dayCol} AS day_override
         FROM users u
         LEFT JOIN week_schedule ws ON ws.user_id = u.id
           AND ws.week_number = $1
           AND ws.week_year = $2`,
        [week, year],
    )

    const isInOffice = (r: OfficeUser & { day_override: boolean | null }): boolean => {
        if (r.day_override !== null) return r.day_override
        return r.default_loc === 'office' && DEFAULT_OFFICE_DAYS.includes(day)
    }

    return {
        office: result.rows.filter(isInOffice),
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

export async function existingCronPost(week: number, year: number, day: number): Promise<CronPost | null> {
    const client = await pgClient()
    const result = await client.query<CronPost>(
        `SELECT * FROM slack_cron_posts WHERE week_number = $1 AND week_year = $2 AND day = $3 LIMIT 1`,
        [week, year, day],
    )
    return result.rows[0] ?? null
}

export function isTodayOfficeDay(day: number): boolean {
    return DEFAULT_OFFICE_DAYS.includes(day)
}
