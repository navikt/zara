import { logger } from '@navikt/next-logger'
import { Pool, PoolClient } from 'pg'

export async function initial_v1(client: Pool | PoolClient): Promise<void> {
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

export async function office_cron_job_v2(client: Pool | PoolClient): Promise<void> {
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

export async function add_away_location_v3(client: Pool | PoolClient): Promise<void> {
    logger.info('Running add_away_location_v3 migration...')
    await client.query(`
        ALTER TABLE users
            DROP CONSTRAINT users_default_loc_check,
            ADD CONSTRAINT users_default_loc_check CHECK (default_loc IN ('office', 'remote', 'away'))
    `)
    await client.query('UPDATE migrations SET version = 3')
}

export async function add_nav_ident_v4(client: Pool | PoolClient): Promise<void> {
    logger.info('Running add_nav_ident_v4 migration...')
    await client.query(`ALTER TABLE users ADD COLUMN nav_ident TEXT UNIQUE`)
    await client.query('UPDATE migrations SET version = 4')
}

export async function quiz_tables_v5(client: Pool | PoolClient): Promise<void> {
    logger.info('Running quiz_tables_v5 migration...')
    await client.query(`
        CREATE TABLE quiz (
            id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            owner_user_id      TEXT NOT NULL,
            is_encrypted       BOOLEAN NOT NULL DEFAULT true,
            content_encrypted  TEXT,
            content_plain      JSONB,
            salt               TEXT,
            title              TEXT,
            question_count     INTEGER,
            default_time_limit INTEGER NOT NULL,
            created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
            last_played_at     TIMESTAMPTZ
        )
    `)
    await client.query(`CREATE INDEX quiz_owner_idx ON quiz (owner_user_id)`)

    await client.query(`
        CREATE TABLE quiz_session (
            id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            quiz_id        UUID NOT NULL REFERENCES quiz(id),
            host_user_id   TEXT NOT NULL,
            started_at     TIMESTAMPTZ NOT NULL,
            ended_at       TIMESTAMPTZ NOT NULL,
            player_count   INTEGER NOT NULL,
            question_count INTEGER NOT NULL,
            total_percent  INTEGER NOT NULL DEFAULT 0
        )
    `)

    await client.query(`
        CREATE TABLE quiz_player_result (
            id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            session_id     UUID NOT NULL REFERENCES quiz_session(id) ON DELETE CASCADE,
            player_user_id TEXT NOT NULL,
            player_name    TEXT NOT NULL,
            points         INTEGER NOT NULL,
            correct_count  INTEGER NOT NULL,
            percent        INTEGER NOT NULL,
            rank           INTEGER NOT NULL
        )
    `)
    await client.query(`CREATE INDEX quiz_player_result_session_idx ON quiz_player_result (session_id)`)

    await client.query(`
        CREATE TABLE quiz_image (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            owner_user_id   TEXT NOT NULL,
            content_type    TEXT NOT NULL,
            bytes_base64    TEXT NOT NULL,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    `)
    await client.query(`CREATE INDEX quiz_image_owner_idx ON quiz_image (owner_user_id)`)

    await client.query('UPDATE migrations SET version = 5')
}
