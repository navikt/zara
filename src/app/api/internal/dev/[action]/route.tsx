import { notFound } from 'next/navigation'
import { logger } from '@navikt/next-logger'
import { faker } from '@faker-js/faker'
import { ContactableUserFeedback, InSituFeedback } from '@navikt/syk-zara/feedback'

import { createContactDetails } from '@dev/test-data'
import { clearDevelopmentFeedback, seedDevelopmentFeedback } from '@dev/seed-valkey'
import { seedDevelopmentPostgres } from '@dev/seed-postgres'
import { bundledEnv } from '@lib/env'
import { getFeedbackClient } from '@services/feedback/feedback-client'
import { valkeyClient } from '@services/db/valkey/production-valkey'
import { postDailySummary } from '@services/slack/summary-to-slack'
import { developmentOnlyResetPostgres, runMigrations } from '@services/db/postgres/migrations'
import { pgClient } from '@services/db/postgres/production-pg'

export async function POST(_: Request, { params }: RouteContext<'/api/internal/dev/[action]'>): Promise<Response> {
    // ⚠️ Dev only endpoint (allow dev-gcp for now)
    if (bundledEnv.runtimeEnv === 'prod-gcp') return notFound()

    const { action } = await params

    logger.info(`🚨 Dev action: "${action}" invoked 🚨`)

    switch (action) {
        case 'debug-cron': {
            const { postLink } = await postDailySummary()
            return Response.json({ message: `Daily summary cron executed!`, link: postLink }, { status: 201 })
        }
        case 'pg-reset': {
            const client = await pgClient()
            await developmentOnlyResetPostgres(client)

            await runMigrations()

            await seedDevelopmentPostgres(client)

            return Response.json({ message: `Postgres reset!` }, { status: 201 })
        }
        case 're-seed': {
            await clearDevelopmentFeedback(valkeyClient())

            const client = getFeedbackClient()
            await seedDevelopmentFeedback(client)

            return Response.json({ message: `Re-seeded!` }, { status: 201 })
        }
        case 'new-feedback': {
            const client = getFeedbackClient()

            const newId = crypto.randomUUID()
            const feedback: Omit<ContactableUserFeedback, 'id'> = {
                type: 'CONTACTABLE',
                name: faker.person.fullName(),
                uid: crypto.randomUUID(),
                message: faker.lorem.lines({ min: 2, max: 5 }),
                timestamp: new Date().toISOString(),
                sentiment: faker.number.int({ min: 1, max: 5 }),
                category: faker.helpers.arrayElement(['FEIL', 'FORSLAG', 'ANNET']),
                ...createContactDetails(),
                contactedAt: null,
                contactedBy: null,
                verifiedContentAt: null,
                verifiedContentBy: null,
                sharedAt: null,
                sharedBy: null,
                sharedLink: null,
                metaSource: 'syk-inn',
                metaLocation: '/dev/foo/bar/baz',
                metaSystem: 'FakeMedDoc',
                metaTags: [],
                redactionLog: [],
                metaDev: { sykmeldingsId: crypto.randomUUID() },
            }

            await client.insert(newId, feedback)
            return Response.json({ message: `Random feedback added!` }, { status: 201 })
        }
        case 'new-in-situ': {
            const client = getFeedbackClient()

            const newId = crypto.randomUUID()
            const feedback: Omit<InSituFeedback, 'id'> = {
                type: 'IN_SITU',
                variant: 'Kvittering',
                name: faker.person.fullName(),
                uid: crypto.randomUUID(),
                message: faker.lorem.lines({ min: 2, max: 5 }),
                timestamp: new Date().toISOString(),
                sentiment: faker.number.int({ min: 1, max: 5 }),
                verifiedContentAt: null,
                verifiedContentBy: null,
                sharedAt: null,
                sharedBy: null,
                sharedLink: null,
                metaSource: 'syk-inn',
                metaLocation: '/dev/foo/bar/baz',
                metaSystem: 'FakeMedDoc',
                metaTags: [],
                redactionLog: [],
                metaDev: { sykmeldingsId: crypto.randomUUID() },
            }

            await client.insert(newId, feedback)
            return Response.json({ message: `Random feedback added!` }, { status: 201 })
        }
        default:
            logger.warn(`⚠️ Got unsupported dev action "${action}"! ⚠️`)
            return Response.json({ message: `Action ${action} is not supported.` }, { status: 400 })
    }
}
