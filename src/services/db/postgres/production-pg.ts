import { logger } from '@navikt/next-logger'
import { lazyNextleton } from 'nextleton'
import * as fs from 'node:fs'
import { Pool } from 'pg'

import { getServerEnv } from '#lib/env'

export const pgClient = lazyNextleton('postgres-client', () => initializePostgres())

async function initializePostgres(): Promise<Pool> {
    const postgresConfig = getServerEnv().postgresConfig

    const pool = new Pool({
        ...postgresConfig,
        ssl:
            postgresConfig.runtimeEnv !== 'local'
                ? {
                      ca: fs.readFileSync(postgresConfig.caPath),
                      key: fs.readFileSync(postgresConfig.keyPath),
                      cert: fs.readFileSync(postgresConfig.certPath),
                  }
                : false,
    })

    logger.info('Connecting to Postgres (nais postgres) database...')
    await pool.connect()

    return pool
}
