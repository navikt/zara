import Valkey from 'iovalkey'

import { getServerEnv } from '@lib/env'

import { productionValkey } from './production-valkey'
import { localDevFakeValkey } from './local-dev-valkey'

export function getValkey(): Valkey {
    if (!getServerEnv().useSykInnValkey) {
        return localDevFakeValkey()
    }

    return productionValkey()
}
