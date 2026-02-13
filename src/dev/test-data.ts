import { faker } from '@faker-js/faker'
import { subDays } from 'date-fns'
import { ContactableUserFeedback, Feedback } from '@navikt/syk-zara'

export function createContactDetails(): Pick<ContactableUserFeedback, 'contactType' | 'contactDetails'> {
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

export function createContactedInfo(
    type: ContactableUserFeedback['contactType'],
): Pick<ContactableUserFeedback, 'contactedAt' | 'contactedBy'> {
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

export function createVerifiedContentInfo(): Pick<Feedback, 'verifiedContentAt' | 'verifiedContentBy'> {
    const wasVerified = faker.datatype.boolean()
    if (!wasVerified) {
        return { verifiedContentAt: null, verifiedContentBy: null }
    }

    return {
        verifiedContentAt: faker.date.between({ from: subDays(new Date(), 30), to: new Date() }).toISOString(),
        verifiedContentBy: faker.person.fullName(),
    }
}
