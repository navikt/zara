import { logger } from '@navikt/next-logger'
import { getISOWeek, getYear } from 'date-fns'
import * as R from 'remeda'

import { pgClient } from '#services/db/postgres/production-pg'
import { OfficeUser } from '#services/team-office/common/types'

export async function currentVakt(team: OfficeUser[]): Promise<(OfficeUser & { skew: number }) | null> {
    const weekSkew = await currentVaktSkew()
    const vaktables = vaktablesOrdered(team)
    if (vaktables.length === 0) {
        logger.warn('No vakts configured?!')
        return null
    }

    const cursor = currentVaktCursor(currentYearWeek().week, vaktables.length, weekSkew)
    return { ...vaktables[cursor], skew: weekSkew }
}

async function currentVaktSkew(): Promise<number> {
    const { year: currentYear, week: currentISOWeek } = currentYearWeek()

    const client = await pgClient()
    await client.query('BEGIN')
    const result = await client.query(`SELECT * from vakt WHERE year = $1 AND week = $2`, [currentYear, currentISOWeek])

    if (result.rowCount === 0) {
        const [previousYear, previousWeek] =
            currentISOWeek === 1 ? [currentYear - 1, 52] : [currentYear, currentISOWeek - 1]
        const previous = await client.query(`SELECT * from vakt WHERE year = $1 AND week = $2`, [
            previousYear,
            previousWeek,
        ])
        const currentSkew = previous.rows?.[0]?.skew ?? 0
        await client.query(
            `
            INSERT INTO vakt (year, week, skew) VALUES ($1, $2, $3)
        `,
            [currentYear, currentISOWeek, currentSkew],
        )

        await client.query('COMMIT')
        return currentSkew
    } else {
        await client.query('COMMIT')
        return result.rows[0].skew
    }
}

export function vaktablesOrdered(team: OfficeUser[]): OfficeUser[] {
    const vaktables = R.pipe(
        team,
        R.filter((it) => it.vaktable),
        R.sortBy((it) => it.user_id),
    )

    return vaktables
}

function currentVaktCursor(week: number, vaktCount: number, weekSkew: number): number {
    return (week + weekSkew) % vaktCount
}

export function currentYearWeek(): { year: number; week: number } {
    const now = new Date()
    const currentISOWeek = getISOWeek(now)
    const currentYear = getYear(now)

    return { year: currentYear, week: currentISOWeek }
}
