import { lazyNextleton } from 'nextleton'
import { Client } from 'pg'
import { logger } from '@navikt/next-logger'

import { getServerEnv } from '@lib/env'

export const pgClient = lazyNextleton('valkey-client', () => initializePostgres())

async function initializePostgres(): Promise<Client> {
    const postgresConfig = getServerEnv().postgresConfig
    const client = new Client({ ...postgresConfig })

    logger.info('Connecting to Postgres (zalando) database...')
    await client.connect()

    return client
}
