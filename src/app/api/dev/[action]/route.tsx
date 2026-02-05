import { notFound } from 'next/navigation'
import { logger } from '@navikt/next-logger'

import { bundledEnv } from '@lib/env'

import { clearDevelopmentFeedback, seedDevelopmentFeedback } from '../../../../dev/seed-valkey'
import { getFeedbackClient } from '../../../../services/feedback/feedback-client'
import { getValkey } from '../../../../services/valkey/valkey'

export async function POST(_: Request, { params }: RouteContext<'/api/dev/[action]'>): Promise<Response> {
    // ⚠️ Dev only endpoint
    if (bundledEnv.runtimeEnv !== 'local') return notFound()

    const { action } = await params

    logger.info(`🚨 Dev action: "${action}" invoked 🚨`)

    switch (action) {
        case 're-seed': {
            const valkey = getValkey()
            await clearDevelopmentFeedback(valkey)

            const feedback = getFeedbackClient(valkey)
            await seedDevelopmentFeedback(feedback)

            return Response.json({ message: `Re-seeded!` }, { status: 201 })
        }
        default:
            logger.warn(`⚠️ Got unsupported dev action "${action}"! ⚠️`)
            return Response.json({ message: `Action ${action} is not supported.` }, { status: 400 })
    }
}
