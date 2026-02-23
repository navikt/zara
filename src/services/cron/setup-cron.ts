import { lazyNextleton } from 'nextleton'
import { Cron } from 'croner'
import { logger } from '@navikt/next-logger'

import { isLeader } from '@services/leader'
import { postDailySummary } from '@services/slack/summary-to-slack'
import { postDailyOfficeSummary, postWeeklyRememberToUpdatePost } from '@services/slack/office-to-slack'

export const setupDailySummaryCron = lazyNextleton('daily-summary-cron', () => {
    const MORNING_9_00 = '0 8 * * *'

    const job = new Cron(MORNING_9_00, async () => {
        try {
            const leader = await isLeader()
            if (!leader) {
                logger.info("I'm not the leader, skipping daily summary job")
                return
            }

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

export const setupDailyOfficeCron = lazyNextleton('daily-office-cron', () => {
    const MORNING_7_00 = '0 6 * * *'

    const job = new Cron(MORNING_7_00, async () => {
        try {
            const leader = await isLeader()
            if (!leader) {
                logger.info("I'm not the leader, skipping daily office job")
                return
            }

            logger.info('Running daily office job')
            const result = await postDailyOfficeSummary()
            if (result.postLink) {
                logger.info(`Daily office posted to Slack, permalink: ${result.postLink}`)
            }
        } catch (e) {
            logger.error(new Error('Daily office cron job failed', { cause: e }))
        }
    })

    logger.info(`Daily office cron configured, will run at ${job.nextRun()?.toISOString()}`)

    return job
})

export const setupWeeklyOfficeCron = lazyNextleton('weekly-office-cron', () => {
    const FRIDAY_10_00 = '0 9 * * 5'

    const job = new Cron(FRIDAY_10_00, async () => {
        try {
            const leader = await isLeader()
            if (!leader) {
                logger.info("I'm not the leader, skipping weekly office job")
                return
            }

            logger.info('Running weekly office job')
            const result = await postWeeklyRememberToUpdatePost()
            if (result.postLink) {
                logger.info(`Weekly office posted to Slack, permalink: ${result.postLink}`)
            }
        } catch (e) {
            logger.error(new Error('Weekly office cron job failed', { cause: e }))
        }
    })

    logger.info(`Weekly office cron configured, will run at ${job.nextRun()?.toISOString()}`)

    return job
})
