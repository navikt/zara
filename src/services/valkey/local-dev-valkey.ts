import { lazyNextleton } from 'nextleton'

import { createInMemoryValkey } from '../../dev/InMemValkey'

export const localDevFakeValkey = lazyNextleton('local-dev-fake-valkey', () => createInMemoryValkey())
