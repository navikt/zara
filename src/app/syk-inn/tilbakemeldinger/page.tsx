import React, { ReactElement } from 'react'
import { logger } from '@navikt/next-logger'

import { getValkey } from '../../../services/valkey/valkey'

export const dynamic = 'force-dynamic'

async function Page(): Promise<ReactElement> {
    const valkey = getValkey()

    const res = await valkey.ping()
    logger.info(res)

    return <div>VALKEY TEST PAGE</div>
}

export default Page
