import { logger } from '@navikt/next-logger'
import { Logger, LogLevel } from '@slack/bolt'

const slackLogger = logger.child({ x_context: 'slack-bot', x_isSlack: true })

export const loggerAdapter: Logger = {
    debug: (msg) => slackLogger.debug(msg),
    info: (msg) => slackLogger.info(msg),
    warn: (msg) => slackLogger.warn(msg),
    error: (msg) => slackLogger.error(msg),
    getLevel: (): LogLevel => slackLogger.level as LogLevel,
    setLevel: (): void => void 0,
    setName: (): void => void 0,
}
