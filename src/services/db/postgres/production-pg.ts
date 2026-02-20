import { lazyNextleton } from 'nextleton'
import { Pool } from 'pg'
import { logger } from '@navikt/next-logger'

import { bundledEnv, getServerEnv } from '@lib/env'

export const pgClient = lazyNextleton('postgres-client', () => initializePostgres())

async function initializePostgres(): Promise<Pool> {
    const postgresConfig = getServerEnv().postgresConfig

    const pool = new Pool({
        ...postgresConfig,
        ssl: bundledEnv.runtimeEnv !== 'local' ? { rejectUnauthorized: false } : false,
    })

    logger.info('Connecting to Postgres (zalando) database...')
    await pool.connect()

    return pool
}
