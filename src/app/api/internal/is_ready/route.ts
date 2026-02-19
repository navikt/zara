import { NextResponse } from 'next/server'
import { logger } from '@navikt/next-logger'

import { getServerEnv } from '@lib/env'
import { setupDailySummaryCron } from '@services/cron/setup-daily-summary-cron'

export async function GET(): Promise<NextResponse> {
    try {
        getServerEnv()

        const cron = setupDailySummaryCron()
        logger.info(`Daily summary cron configured, will run at ${cron.nextRun()?.toISOString()}`)
    } catch (e) {
        logger.error(e)
        return NextResponse.json({ message: 'I am not ready :(' }, { status: 500 })
    }

    return NextResponse.json({ message: 'I am ready :)' })
}
