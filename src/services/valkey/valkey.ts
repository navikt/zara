import Valkey from 'iovalkey'

import { realValkey, subscriberValkey } from './production-valkey'

export function getValkey(): Valkey {
    subscriberValkey()

    return realValkey()
}
