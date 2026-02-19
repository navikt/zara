import * as R from 'remeda'
import { logger } from '@navikt/next-logger'
import Valkey from 'iovalkey'
import { faker } from '@faker-js/faker'
import { subDays } from 'date-fns'
import { InSituFeedback, ContactableUserFeedback } from '@navikt/syk-zara/feedback'
import { AdminFeedbackClient } from '@navikt/syk-zara/feedback/admin'

import { bundledEnv } from '@lib/env'
import { raise } from '@lib/ts'

import { createContactDetails, createContactedInfo, createVerifiedContentInfo } from './test-data'

export async function seedDevelopmentFeedback(client: AdminFeedbackClient): Promise<void> {
    if (bundledEnv.runtimeEnv !== 'local') {
        raise("What the hell are you doing?! Don't seed any cloud environments! :angst:")
    }

    const range = R.range(0, 50)
    logger.info(`Seeding valkey with ${range.length} feedback entries...`)
    for (const index of range) {
        const id = crypto.randomUUID()
        const timestamp =
            index < 10
                ? faker.date.between({ from: subDays(new Date(), 1), to: Date.now() }).toISOString()
                : faker.date.between({ from: subDays(new Date(), 60), to: Date.now() }).toISOString()

        if (Math.random() > 0.7) {
            await client.insert(id, insertFullContactable(timestamp))
        } else {
            await client.insert(id, insertSmallInSitu(timestamp))
        }
    }
    logger.info(`Seeding valkey done!`)
}

function insertFullContactable(timestamp: string): Omit<ContactableUserFeedback, 'id'> {
    const contactDetails = createContactDetails()
    return {
        type: 'CONTACTABLE',
        name: faker.person.fullName(),
        uid: crypto.randomUUID(),
        message: faker.lorem.lines({ min: 1, max: 5 }),
        sentiment: faker.number.int({ min: 1, max: 5 }),
        category: 'ANNET',
        timestamp: timestamp,
        redactionLog: [],
        metaTags: [],
        metaSource: 'syk-inn',
        metaLocation: 'feedback root',
        metaSystem: 'FakeMedDoc',
        metaDev: {},
        sharedAt: null,
        sharedBy: null,
        sharedLink: null,
        ...contactDetails,
        ...createContactedInfo(contactDetails.contactType),
        ...createVerifiedContentInfo(),
    } satisfies Omit<ContactableUserFeedback, 'id'>
}

function insertSmallInSitu(timestamp: string): Omit<InSituFeedback, 'id'> {
    const contactDetails = createContactDetails()
    return {
        type: 'IN_SITU',
        variant: 'Kvittering',
        name: faker.person.fullName(),
        uid: crypto.randomUUID(),
        message: faker.lorem.lines({ min: 1, max: 5 }),
        sentiment: faker.number.int({ min: 1, max: 5 }),
        timestamp: timestamp,
        redactionLog: [],
        metaTags: [],
        metaSource: 'syk-inn',
        metaLocation: 'feedback root',
        metaSystem: 'FakeMedDoc',
        metaDev: {},
        sharedAt: null,
        sharedBy: null,
        sharedLink: null,
        ...contactDetails,
        ...createContactedInfo(contactDetails.contactType),
        ...createVerifiedContentInfo(),
    } satisfies Omit<InSituFeedback, 'id'>
}

export async function clearDevelopmentFeedback(valkey: Valkey): Promise<void> {
    if (bundledEnv.runtimeEnv !== 'local') {
        raise('⚠️☠️🚨 You are trying to clear feedback in a non-development environment! 🚨☠️⚠️')
    }

    const feedbackKeys = await valkey.keys(`feedback:*`)
    logger.warn(`Deleting all feedback entries (${feedbackKeys.length}) in Valkey...`)
    feedbackKeys.forEach((key) => valkey.del(key))
}
