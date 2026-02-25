import { Pool } from 'pg'
import { logger } from '@navikt/next-logger'

export async function initial_v1(client: Pool): Promise<void> {
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

export async function office_cron_job_v2(client: Pool): Promise<void> {
    logger.info('Running office_cron_job_v2 migration...')
    await client.query(`
        CREATE TABLE slack_cron_posts (
            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            week_number INTEGER NOT NULL,
            week_year   INTEGER NOT NULL,
            day         INTEGER NOT NULL,
            channel_id  TEXT NOT NULL,
            message_ts  TEXT NOT NULL,
            UNIQUE (week_number, week_year, day)
        )
    `)
    await client.query('UPDATE migrations SET version = 2')
}

export async function add_away_location_v3(client: Pool): Promise<void> {
    logger.info('Running add_away_location_v3 migration...')
    await client.query(`
        ALTER TABLE users
            DROP CONSTRAINT users_default_loc_check,
            ADD CONSTRAINT users_default_loc_check CHECK (default_loc IN ('office', 'remote', 'away'))
    `)
    await client.query('UPDATE migrations SET version = 3')
}
