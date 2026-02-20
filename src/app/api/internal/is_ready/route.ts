import { NextResponse } from 'next/server'
import { logger } from '@navikt/next-logger'
import { nextleton } from 'nextleton'

import { getServerEnv } from '@lib/env'
import { setupDailyOfficeCron, setupDailySummaryCron, setupWeeklyOfficeCron } from '@services/cron/setup-cron'
import { runMigrations } from '@services/db/postgres/migrations'

const migrationStatus = nextleton('migration-status', () => ({
    executed: false,
}))

export async function GET(): Promise<NextResponse> {
    try {
        getServerEnv()

        if (!migrationStatus.executed) {
            await runMigrations().then(() => {
                migrationStatus.executed = true
            })
        }

        setupDailySummaryCron()
        setupDailyOfficeCron()
        setupWeeklyOfficeCron()
    } catch (e) {
        logger.error(e)
        return NextResponse.json({ message: 'I am not ready :(' }, { status: 500 })
    }

    return NextResponse.json({ message: 'I am ready :)' })
}
