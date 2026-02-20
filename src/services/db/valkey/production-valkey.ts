import { lazyNextleton } from 'nextleton'
import Valkey from 'iovalkey'
import * as R from 'remeda'
import { logger } from '@navikt/next-logger'

import { getServerEnv } from '@lib/env'

export const valkeyClient = lazyNextleton('valkey-client', () => initializeValkey())
export const subscriberValkeyClient = lazyNextleton('subscriber-valkey', () => initializeValkey())

function initializeValkey(): Valkey {
    const valkeyConfig = getServerEnv().valkeyConfig

    const client = new Valkey({
        ...R.omit(valkeyConfig, ['runtimeEnv']),
        connectTimeout: 5000,
        enableReadyCheck: false,
    })

    client.on('error', (err: Error) => logger.error(err))

    return client
}
