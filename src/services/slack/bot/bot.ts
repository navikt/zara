import { App as BoltApp } from '@slack/bolt'
import { lazyNextleton } from 'nextleton'
import { logger } from '@navikt/next-logger'

import { getServerEnv } from '@lib/env'

import { loggerAdapter } from './bot-logger'
import { configureOfficeUpdatesListeners } from './office-updates-events'

const boltApp = lazyNextleton('boltorini', () => {
    const serverEnv = getServerEnv()

    return new BoltApp({
        socketMode: true,
        token: serverEnv.zaraSlackBotToken,
        appToken: serverEnv.zaraSlackAppToken,
        logger: loggerAdapter,
    })
})

export async function initializeBot(): Promise<App> {
    logger.info('Initializing Slack bot...')

    const app = boltApp()
    configureOfficeUpdatesListeners(app)

    await app.start()
    logger.info(`Started Slack bot in socket mode`)

    return app
}

export type App = BoltApp
export default boltApp
