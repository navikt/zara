'use server'

import { logger } from '@navikt/next-logger'
import { revalidatePath } from 'next/cache'
import { after } from 'next/server'

import { raise } from '#lib/ts'
import { validateUserSession } from '#services/auth/auth'
import { pgClient } from '#services/db/postgres/production-pg'
import { updateTodaysOfficeSummaryIfNeeded } from '#services/slack/office-to-slack'
import { Location } from '#services/team-office/common/types'
import { setAllDays } from '#services/team-office/internal/office-service'
import { getMyself } from '#services/team-office/me-office-service'

export async function registerKontor(newLocation: Location): Promise<void> {
    const user = await validateUserSession('TEAM_MEMBER')
    const client = await pgClient()

    await client.query('BEGIN')
    const isNewUser = await client
        .query('SELECT 1 FROM users WHERE user_id = $1', [user.userId])
        .then((res) => res.rowCount === 0)

    if (isNewUser) {
        await client.query(`INSERT INTO users (user_id, name, default_loc) VALUES ($1, $2, $3)`, [
            user.userId,
            user.name,
            newLocation,
        ])
    } else {
        await client.query(`UPDATE users SET default_loc = $2 WHERE user_id = $1`, [user.userId, newLocation])
    }

    if (newLocation === 'away') {
        await client.query(`UPDATE users SET vaktable = FALSE WHERE user_id = $1`, [user.userId])
    }
    await client.query('COMMIT')

    revalidatePath('/team/kontor')
    revalidatePath('/team/kontor/settings')
}

/**
 * daysOn are days that should be true, days without a value should be false.
 *
 * '0' = Monday, etc
 */
export async function toggleWeekDay(week: number, daysOn: string[]): Promise<void> {
    const user = await getMyself()
    if ('unregistered' in user) {
        raise(
            `Logged in user not found in database. This should never happen, since registerKontor should have been called first.`,
        )
    }

    await setAllDays(
        user.id,
        week,
        daysOn.map((it) => +it),
    )

    after(async () => {
        await updateTodaysOfficeSummaryIfNeeded()
    })

    revalidatePath('/team/kontor')
}

export async function toggleVakt(userToToggle: string): Promise<void> {
    await validateUserSession('TEAM_MEMBER')
    const client = await pgClient()

    await client.query(
        `UPDATE users
            SET vaktable = NOT vaktable
         WHERE id = $1`,
        [userToToggle],
    )

    revalidatePath('/')
    revalidatePath('/team/kontor/settings')
}

export async function skewVakt(year: number, week: number, skew: number): Promise<void> {
    await validateUserSession('TEAM_MEMBER')
    const client = await pgClient()

    await client.query('BEGIN')
    await client.query(
        `INSERT INTO vakt (year, week, skew)
            VALUES ($1, $2, $3)
            ON CONFLICT (year, week) DO UPDATE SET skew = $3`,
        [year, week, skew],
    )
    await client.query('COMMIT')

    revalidatePath('/team/kontor/settings')
}

export async function nukeMe(): Promise<void> {
    const { userId } = await validateUserSession('TEAM_MEMBER')
    const client = await pgClient()

    await client.query('BEGIN')
    await client.query('DELETE FROM week_schedule WHERE user_id = (SELECT id FROM users WHERE user_id = $1)', [userId])
    await client.query('DELETE FROM users WHERE user_id = $1', [userId])
    await client.query('COMMIT')

    logger.info(`User ${userId} successfully deleted themselves.`)

    revalidatePath('/team/kontor')
    revalidatePath('/team/kontor/settings')
}
