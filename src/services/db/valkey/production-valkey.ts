import { lazyNextleton } from 'nextleton'
import Valkey from 'iovalkey'
import * as R from 'remeda'
import { logger } from '@navikt/next-logger'

import { getServerEnv } from '@lib/env'

export const valkeyClient = lazyNextleton('valkey-client', () => initializeValkey())
export const subscriberValkeyClient = lazyNextleton('subscriber-valkey', () => initializeValkey())

/**
 * Creates a brand-new, dedicated Valkey connection for a single subscriber. A Valkey
 * connection in subscribe mode can't be shared safely (unsubscribing affects every channel
 * on that connection), so anything that subscribes to a short-lived, per-request channel —
 * e.g. one SSE stream per live quiz session — should own its own connection and `.quit()` it
 * on cleanup, rather than reuse the shared {@link subscriberValkeyClient} singleton.
 */
export function createValkeySubscriber(): Valkey {
    return initializeValkey()
}

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
