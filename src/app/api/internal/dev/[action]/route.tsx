import { notFound } from 'next/navigation'
import { logger } from '@navikt/next-logger'
import { faker } from '@faker-js/faker'

import { createContactDetails } from '@dev/test-data'
import { clearDevelopmentFeedback, seedDevelopmentFeedback } from '@dev/seed-valkey'
import { bundledEnv } from '@lib/env'
import { getFeedbackClient } from '@services/feedback/feedback-client'
import { getValkey } from '@services/valkey/valkey'

export async function POST(_: Request, { params }: RouteContext<'/api/internal/dev/[action]'>): Promise<Response> {
    // ⚠️ Dev only endpoint (allow dev-gcp for now)
    if (bundledEnv.runtimeEnv === 'prod-gcp') return notFound()

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
        case 'new-feedback': {
            const valkey = getValkey()
            const client = getFeedbackClient(valkey)

            const newId = crypto.randomUUID()
            await client.create(newId, {
                name: faker.person.fullName(),
                message: faker.lorem.lines({ min: 2, max: 5 }),
                timestamp: new Date().toISOString(),
                ...createContactDetails(),
                contactedAt: null,
                contactedBy: null,
                verifiedContentAt: null,
                verifiedContentBy: null,
            })

            valkey.publish('channel:new-feedback', newId)

            return Response.json({ message: `Random feedback added!` }, { status: 201 })
        }
        default:
            logger.warn(`⚠️ Got unsupported dev action "${action}"! ⚠️`)
            return Response.json({ message: `Action ${action} is not supported.` }, { status: 400 })
    }
}
