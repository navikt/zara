'use server'

import { getISOWeekYear } from 'date-fns'
import { revalidatePath } from 'next/cache'
import { after } from 'next/server'

import { pgClient } from '@services/db/postgres/production-pg'
import { validateUserSession } from '@services/auth/auth'
import { raise } from '@lib/ts'
import { updateTodaysOfficeSummaryIfNeeded } from '@services/slack/office-to-slack'

export async function registerKontor(defaultLoc: 'office' | 'remote'): Promise<void> {
    const user = await validateUserSession()
    const client = await pgClient()

    await client.query(
        `INSERT INTO users (user_id, name, default_loc)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, default_loc = EXCLUDED.default_loc`,
        [user.userId, user.name, defaultLoc],
    )

    revalidatePath('/team/kontor')
}

/**
 * daysOn are days that should be true, days without a value should be false.
 *
 * '0' = Monday, etc
 */
export async function toggleWeekDay(week: number, daysOn: string[]): Promise<void> {
    const user = await validateUserSession()
    const client = await pgClient()

    const days = ['mon', 'tue', 'wed', 'thu', 'fri']
    const values = days.map((_, i) => daysOn.includes(String(i)))
    const weekYear = getISOWeekYear(new Date())

    const { rows: userRows } = await client.query<{ id: string }>('SELECT id FROM users WHERE user_id = $1', [
        user.userId,
    ])
    const userId = userRows[0]?.id
    if (!userId) {
        raise(
            `User with user_id ${user.userId} not found in database. This should never happen, since registerKontor should have been called first.`,
        )
    }

    await client.query(
        `INSERT INTO week_schedule (user_id, week_number, week_year, mon, tue, wed, thu, fri)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (user_id, week_number, week_year)
         DO UPDATE SET mon = EXCLUDED.mon, tue = EXCLUDED.tue, wed = EXCLUDED.wed, thu = EXCLUDED.thu, fri = EXCLUDED.fri`,
        [userId, week, weekYear, ...values],
    )

    after(() => {
        updateTodaysOfficeSummaryIfNeeded()
    })

    revalidatePath('/team/kontor')
}
