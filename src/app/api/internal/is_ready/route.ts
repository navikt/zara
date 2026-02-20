import { NextResponse } from 'next/server'
import { logger } from '@navikt/next-logger'

import { getServerEnv } from '@lib/env'
import { setupDailyOfficeCron, setupDailySummaryCron, setupWeeklyOfficeCron } from '@services/cron/setup-cron'
import { runMigrations } from '@services/db/postgres/migrations'

export async function GET(): Promise<NextResponse> {
    try {
        getServerEnv()

        await runMigrations()

        setupDailySummaryCron()
        setupDailyOfficeCron()
        setupWeeklyOfficeCron()
    } catch (e) {
        logger.error(e)
        return NextResponse.json({ message: 'I am not ready :(' }, { status: 500 })
    }

    return NextResponse.json({ message: 'I am ready :)' })
}
