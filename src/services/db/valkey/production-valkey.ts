import { GlideClient, GlideClientConfiguration } from '@valkey/valkey-glide'
import { lazyNextleton } from 'nextleton'

import { getServerEnv } from '#lib/env'
import { raise } from '#lib/ts'

export const realValkey = lazyNextleton('valkey-client', () => GlideClient.createClient(getGlideClientConfig()))

export function getGlideClientConfig(): GlideClientConfiguration {
    const valkeyConfig = getServerEnv().valkeyConfig ?? raise('Valkey config is not set! :(')

    return {
        clientName: 'zara',
        addresses: [{ host: valkeyConfig.host, port: valkeyConfig.port }],
        credentials: valkeyConfig.password
            ? { username: valkeyConfig.username, password: valkeyConfig.password }
            : undefined,
        useTLS: valkeyConfig.tls,
    }
}
