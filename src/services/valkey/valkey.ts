import Valkey from 'iovalkey'

import { realValkey } from './production-valkey'

export function getValkey(): Valkey {
    return realValkey()
}
