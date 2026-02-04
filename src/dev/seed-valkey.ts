import * as R from 'remeda'
import { logger } from '@navikt/next-logger'
import Valkey from 'iovalkey'
import { faker } from '@faker-js/faker'
import { subDays } from 'date-fns'
import { FEEDBACK_KEY_PREFIX } from '@navikt/syk-zara'

import { bundledEnv } from '@lib/env'
import { raise } from '@lib/ts'

import { Feedback, FeedbackClient } from '../services/feedback/feedback-client'

export async function seedDevelopmentFeedback(client: FeedbackClient): Promise<void> {
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
        const contactDetails = createContactDetails()

        await client.create(id, {
            name: faker.person.fullName(),
            message: faker.lorem.lines({ min: 1, max: 5 }),
            timestamp: timestamp,
            ...contactDetails,
            ...createContactedInfo(contactDetails.contactType),
        })
    }
    logger.info(`Seeding valkey done!`)
}

function createContactDetails(): Pick<Feedback, 'contactType' | 'contactDetails'> {
    const contactType = faker.helpers.arrayElement(['PHONE', 'EMAIL', 'NONE'])
    switch (contactType) {
        case 'NONE':
            return { contactType, contactDetails: null }
        case 'PHONE':
            return { contactType, contactDetails: faker.helpers.fromRegExp(/[49][0-9]{7}/) }
        default:
            return { contactType, contactDetails: faker.internet.email() }
    }
}

function createContactedInfo(type: Feedback['contactType']): Pick<Feedback, 'contactedAt' | 'contactedBy'> {
    if (type === 'NONE') {
        return { contactedAt: null, contactedBy: null }
    }

    const wasContacted = faker.datatype.boolean()
    if (!wasContacted) {
        return { contactedAt: null, contactedBy: null }
    }

    return {
        contactedAt: faker.date.between({ from: subDays(new Date(), 30), to: new Date() }).toISOString(),
        contactedBy: faker.person.fullName(),
    }
}

export async function clearDevelopmentFeedback(valkey: Valkey): Promise<void> {
    if (bundledEnv.runtimeEnv !== 'local') {
        raise('⚠️☠️🚨 You are trying to clear feedback in a non-development environment! 🚨☠️⚠️')
    }

    const feedbackKeys = await valkey.keys(`${FEEDBACK_KEY_PREFIX}*`)
    logger.warn(`Deleting all feedback entries (${feedbackKeys.length}) in Valkey...`)
    feedbackKeys.forEach((key) => valkey.del(key))
}
