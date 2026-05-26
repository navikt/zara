import { NextResponse } from 'next/server'
import { logger } from '@navikt/next-logger'
import { nextleton } from 'nextleton'

import { getServerEnv } from '@lib/env'
import { setupDailyOfficeCron, setupDailySummaryCron, setupWeeklyOfficeCron } from '@services/cron/setup-cron'
import { runMigrations } from '@services/db/postgres/migrations'
import { initializeBot } from '@services/slack/bot/bot'

const migrationStatus = nextleton('migration-status', () => ({
    doing: false,
    executed: false,
}))

const botStarted = nextleton('bot-started', () => ({
    doing: false,
    executed: false,
}))

export async function GET(): Promise<NextResponse> {
    try {
        getServerEnv()

        if (migrationStatus.doing || botStarted.doing) {
            return NextResponse.json(
                { message: 'I am not ready, waiting for migration/bot in another request!' },
                { status: 423 },
            )
        }

        if (!migrationStatus.executed && !migrationStatus.doing) {
            migrationStatus.doing = true
            await runMigrations()
                .then(() => {
                    migrationStatus.executed = true
                })
                .finally(() => {
                    migrationStatus.doing = false
                })
        }

        if (!botStarted.executed && !botStarted.doing) {
            botStarted.doing = true
            await initializeBot()
                .then(() => {
                    botStarted.executed = true
                })
                .finally(() => {
                    botStarted.doing = false
                })
        }

        setupDailySummaryCron()
        setupDailyOfficeCron()
        setupWeeklyOfficeCron()
    } catch (e) {
        logger.error(e)
        return NextResponse.json({ message: 'I am not ready, something failed :(' }, { status: 500 })
    }

    return NextResponse.json({ message: 'I am ready :)' })
}
