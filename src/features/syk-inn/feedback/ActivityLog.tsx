import { Process } from '@navikt/ds-react'
import React, { ReactElement } from 'react'
import * as R from 'remeda'
import { EyeWithPupilIcon, InboxDownIcon, PersonGavelIcon, ScissorsIcon, TasklistSendIcon } from '@navikt/aksel-icons'
import { Feedback } from '@navikt/syk-zara'

import { toReadableDateTime } from '@lib/date'

type Props = {
    feedback: Feedback
}

function ActivityLog({ feedback }: Props): ReactElement {
    const events: {
        title: string
        body: string
        timestamp: string | null
        bullet: React.ReactNode
    }[] = []

    if (feedback.verifiedContentAt != null) {
        events.push({
            title: `Sjekket personopplysninger`,
            body: `Bekreftet av ${feedback.verifiedContentBy}`,
            timestamp: feedback.verifiedContentAt,
            bullet: <PersonGavelIcon aria-hidden />,
        })
    }

    if (feedback.contactedAt != null) {
        events.push({
            title: `Bruker kontaktet`,
            body: `Kontaktet av ${feedback.contactedBy}`,
            timestamp: feedback.contactedAt,
            bullet: <TasklistSendIcon aria-hidden />,
        })
    }

    events.push(
        ...feedback.redactionLog.map((it) => ({
            title: 'Sladding utført',
            timestamp: it.timestamp,
            body: `${it.name} sladdet ${it.count} ord`,
            bullet: <ScissorsIcon aria-hidden />,
        })),
    )

    const now = new Date().toISOString()
    const sortedEvents = R.sortBy(events, [(it) => it.timestamp ?? now, 'asc'])

    return (
        <div className="mt-4">
            <Process>
                <Process.Event
                    title="Tilbakemelding mottatt fra behandler"
                    timestamp={toReadableDateTime(feedback.timestamp)}
                    bullet={<InboxDownIcon aria-hidden />}
                />
                {
                    sortedEvents.map(
                        (event, index) => (
                            <Process.Event
                                key={index}
                                title={event.title}
                                timestamp={event.timestamp ? toReadableDateTime(event.timestamp, true) : undefined}
                                bullet={event.bullet}
                            >
                                {event.body}
                            </Process.Event>
                        ),
                        // <Process> typing messes up mapping children like this :huh:
                    ) as never
                }
                <Process.Event
                    title="Du ser på denne aktivitetsloggen, hei du!"
                    bullet={<EyeWithPupilIcon aria-hidden />}
                />
            </Process>
        </div>
    )
}

export default ActivityLog
