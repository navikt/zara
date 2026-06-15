import React, { ReactElement, ReactNode } from 'react'
import { logger } from '@navikt/next-logger'
import { LocalAlert } from '@navikt/ds-react'
import { LocalAlertContent, LocalAlertHeader, LocalAlertTitle } from '@navikt/ds-react/LocalAlert'

import { validateUserSession } from '@services/auth/auth'
import { getConsumerGroupDetails } from '@services/kafka/kafka-admin-service'

import ConsumerGroupDetailsView from './ConsumerGroupDetailsView'

type Props = {
    groupId: string
}

async function KafkaConsumerGroupSearchInfo({ groupId }: Props): Promise<ReactElement> {
    await validateUserSession('UTVIKLER')

    let details
    try {
        details = await getConsumerGroupDetails(groupId)
    } catch (error) {
        logger.error(`Unable to look up consumer group ${groupId}: ${error}`)

        return (
            <KafkaConsumerGroupError
                title="Får ikke kontakt med Kafka"
                description="Klarte ikke å hente consumer group fra Aiven-poolen. Prøv å søke på nytt."
            />
        )
    }

    if (details == null) {
        return (
            <LocalAlert status="warning" className="max-w-prose mt-4">
                <LocalAlertHeader>
                    <LocalAlertTitle>Fant ingen consumer group</LocalAlertTitle>
                </LocalAlertHeader>
                <LocalAlertContent>
                    Fant ingen consumer group som matcher «{groupId}». Sjekk at group-IDen er riktig.
                </LocalAlertContent>
            </LocalAlert>
        )
    }

    return <ConsumerGroupDetailsView details={details} />
}

function KafkaConsumerGroupError({
    title,
    description,
}: {
    title: string
    description: string | ReactNode
}): ReactElement {
    return (
        <LocalAlert status="error" className="max-w-prose mt-4">
            <LocalAlertHeader>
                <LocalAlertTitle>{title}</LocalAlertTitle>
            </LocalAlertHeader>
            <LocalAlertContent>{description}</LocalAlertContent>
        </LocalAlert>
    )
}

export default KafkaConsumerGroupSearchInfo
