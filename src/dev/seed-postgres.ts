import { logger } from '@navikt/next-logger'
import { Pool } from 'pg'
import { addWeeks, getISOWeek, getISOWeekYear, subWeeks } from 'date-fns'

import { bundledEnv } from '@lib/env'
import { raise } from '@lib/ts'

const TEAM_MEMBERS = [
    { user_id: 'K123456', name: 'Kar O.', default_loc: 'office' },
    { user_id: 'A234567', name: 'Anders B.', default_loc: 'remote' },
    { user_id: 'M345678', name: 'Maria C.', default_loc: 'office' },
    { user_id: 'T456789', name: 'Tine D.', default_loc: 'remote' },
    { user_id: 'E567890', name: 'Erik F.', default_loc: 'office' },
]

export async function seedDevelopmentPostgres(client: Pool): Promise<void> {
    if (bundledEnv.runtimeEnv !== 'local') {
        raise("What the hell are you doing?! Don't seed any cloud environments! :angst:")
    }

    logger.info(`Seeding postgres with ${TEAM_MEMBERS.length} users...`)
    for (const member of TEAM_MEMBERS) {
        await client.query(
            `INSERT INTO users (user_id, name, default_loc)
             VALUES ($1, $2, $3)
             ON CONFLICT (user_id) DO NOTHING`,
            [member.user_id, member.name, member.default_loc],
        )
    }
    await seedWeekSchedules(client)
    logger.info('Seeding postgres done!')
}

export function developmentOnlyResetPostgres(client: Pool): Promise<void> {
    if (bundledEnv.runtimeEnv !== 'local') raise('What the HELL are you doing?')

    return client
        .query(
            `
        DROP TABLE IF EXISTS slack_cron_posts;
        DROP TABLE IF EXISTS week_schedule;
        DROP TABLE IF EXISTS users;
        DROP TABLE IF EXISTS migrations;
    `,
        )
        .then(() => logger.info('Postgres reset complete!'))
}

async function seedWeekSchedules(client: Pool): Promise<void> {
    const now = new Date()
    const weeks = [subWeeks(now, 1), now, addWeeks(now, 1)].map((d) => ({
        week_number: getISOWeek(d),
        week_year: getISOWeekYear(d),
    }))

    // user_id -> per-week overrides [lastWeek, thisWeek, nextWeek]
    const schedules: Record<string, Array<Record<'mon' | 'tue' | 'wed' | 'thu' | 'fri', boolean>>> = {
        K123456: [
            { mon: true, tue: true, wed: false, thu: true, fri: true },
            { mon: true, tue: false, wed: true, thu: true, fri: false },
            { mon: true, tue: true, wed: true, thu: true, fri: false },
        ],
        A234567: [
            { mon: true, tue: true, wed: false, thu: false, fri: false },
            { mon: false, tue: false, wed: true, thu: false, fri: false },
            { mon: true, tue: false, wed: true, thu: false, fri: true },
        ],
        M345678: [
            { mon: true, tue: true, wed: true, thu: true, fri: false },
            { mon: false, tue: false, wed: true, thu: true, fri: true },
            { mon: true, tue: true, wed: true, thu: false, fri: true },
        ],
        T456789: [
            { mon: false, tue: true, wed: false, thu: true, fri: false },
            { mon: true, tue: false, wed: false, thu: false, fri: true },
            { mon: false, tue: false, wed: true, thu: false, fri: false },
        ],
        E567890: [
            { mon: false, tue: true, wed: true, thu: true, fri: true },
            { mon: true, tue: true, wed: false, thu: false, fri: true },
            { mon: false, tue: true, wed: true, thu: true, fri: false },
        ],
    }

    for (const [user_id, weekEntries] of Object.entries(schedules)) {
        const { rows } = await client.query<{ id: string }>('SELECT id FROM users WHERE user_id = $1', [user_id])
        const userId = rows[0]?.id
        if (!userId) continue

        for (let i = 0; i < weeks.length; i++) {
            const days = weekEntries[i]
            const { week_number, week_year } = weeks[i]
            await client.query(
                `INSERT INTO week_schedule (user_id, week_number, week_year, mon, tue, wed, thu, fri)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 ON CONFLICT (user_id, week_number, week_year) DO NOTHING`,
                [
                    userId,
                    week_number,
                    week_year,
                    days.mon ?? null,
                    days.tue ?? null,
                    days.wed ?? null,
                    days.thu ?? null,
                    days.fri ?? null,
                ],
            )
        }
    }
}
