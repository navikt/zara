import { Pool } from 'pg'
import { logger } from '@navikt/next-logger'

import { bundledEnv } from '@lib/env'
import { raise } from '@lib/ts'
import { pgClient } from '@services/db/postgres/production-pg'

export async function runMigrations(): Promise<void> {
    const client = await pgClient()
    const version = await getCurrentVersion(client)

    logger.info(`Current postgres schema version: ${version}`)

    switch (version) {
        case 0:
            await initial_v1(client)
    }
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

async function initial_v1(client: Pool): Promise<void> {
    logger.info('Running initial_v1 migration...')
    await client.query(`
        CREATE TABLE users (
            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id     TEXT NOT NULL UNIQUE,
            name        TEXT NOT NULL,
            default_loc TEXT NOT NULL CHECK (default_loc IN ('office', 'remote'))
        )
    `)
    await client.query(`
        CREATE TABLE week_schedule (
            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id     UUID NOT NULL REFERENCES users(id),
            week_number INTEGER NOT NULL,
            week_year   INTEGER NOT NULL,
            mon         BOOLEAN NOT NULL,
            tue         BOOLEAN NOT NULL,
            wed         BOOLEAN NOT NULL,
            thu         BOOLEAN NOT NULL,
            fri         BOOLEAN NOT NULL,
            UNIQUE (user_id, week_number, week_year)
        )
    `)
    await client.query('INSERT INTO migrations (version) VALUES (1)')
}

export function developmentOnlyResetPostgres(client: Pool): Promise<void> {
    if (bundledEnv.runtimeEnv !== 'local') raise('What the HELL are you doing?')

    return client
        .query(
            `
        DROP TABLE IF EXISTS week_schedule;
        DROP TABLE IF EXISTS users;
        DROP TABLE IF EXISTS migrations;
    `,
        )
        .then(() => logger.info('Postgres reset complete!'))
}
