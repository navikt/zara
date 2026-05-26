import { CronPost, OfficeUser } from '@services/team-office/common/types'
import { pgClient } from '@services/db/postgres/production-pg'

import { DEFAULT_OFFICE_DAYS, WEEK_DAYS } from '../common/day-utils'

export async function getOfficeSnapshot(year: number, week: number, day: number): Promise<{ office: OfficeUser[] }> {
    if (day < 0) throw new Error('Day cannot be negative')

    // Saturday and sunday
    if (day > 4) return { office: [] }

    const client = await pgClient()
    const dayCol = WEEK_DAYS[day]

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
