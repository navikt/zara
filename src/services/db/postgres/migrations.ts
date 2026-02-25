import { Pool } from 'pg'
import { logger } from '@navikt/next-logger'

import { pgClient } from '@services/db/postgres/production-pg'
import { initial_v1, office_cron_job_v2, add_away_location_v3 } from '@services/db/postgres/schema'

export async function runMigrations(): Promise<void> {
    const client = await pgClient()
    const version = await getCurrentVersion(client)

    logger.info(`Current postgres schema version: ${version}`)

    await client.query('BEGIN')
    /**
     * This switch uses fall-through on purpose!!
     */
    switch (version) {
        case 0:
            await initial_v1(client)
        case 1:
            await office_cron_job_v2(client)
        case 2:
            await add_away_location_v3(client)
    }
    await client.query('COMMIT')
}

async function getCurrentVersion(client: Pool): Promise<number> {
    await client.query(`
        CREATE TABLE IF NOT EXISTS migrations (
            version INTEGER NOT NULL
        )
    `)

    const result = await client.query<{ version: number }>('SELECT version FROM migrations LIMIT 1')
    return result.rows[0]?.version ?? 0
}
