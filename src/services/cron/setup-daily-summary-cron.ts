import { lazyNextleton } from 'nextleton'
import { Cron } from 'croner'
import { logger } from '@navikt/next-logger'

import { isLeader } from '@services/leader'
import { postDailySummary } from '@services/slack/summary-to-slack'

/**
 * Every morning at 9:00
 */
const MORNING_9_00 = '0 9 * * *'

export const setupDailySummaryCron = lazyNextleton('daily-summary-cron', () => {
    const job = new Cron(MORNING_9_00, async () => {
        try {
            const leader = await isLeader()
            if (!leader) logger.info("I'm not the leader, skipping daily summary job")

            logger.info('Running daily summary job')
            const result = await postDailySummary()
            if (result.postLink) {
                logger.info(`Daily summary posted to Slack, permalink: ${result.postLink}`)
            }
        } catch (e) {
            logger.error(new Error('Daily summary cron job failed', { cause: e }))
        }
    })

    logger.info(`Daily summary cron configured, will run at ${job.nextRun()?.toISOString()}`)

    return job
})
