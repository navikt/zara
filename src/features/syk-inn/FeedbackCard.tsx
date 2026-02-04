import React, { ReactElement } from 'react'
import { Detail, Heading } from '@navikt/ds-react'
import { ArrowRightIcon, CircleSlashIcon, EnvelopeClosedIcon, PhoneIcon } from '@navikt/aksel-icons'
import Link from 'next/link'
import { formatDistanceToNowStrict } from 'date-fns'
import { nb } from 'date-fns/locale'

import { MultilineUserFeedback } from '@components/feedback/MultilineUserFeedback'

import { Feedback } from '../../services/feedback/feedback-client'

export function FeedbackCard({ feedback }: { feedback: Feedback }): ReactElement {
    return (
        <div>
            <div className="bg-ax-bg-raised border border-ax-border-neutral-subtle rounded-md flex flex-col justify-between overflow-hidden">
                <Link
                    href={`/syk-inn/tilbakemeldinger/${feedback.id}`}
                    className="group px-3 py-2 flex justify-between hover:bg-ax-bg-meta-purple-moderate-hover"
                >
                    <Heading size="xsmall">Tilbakemelding fra {feedback.name}</Heading>
                    <ArrowRightIcon
                        className="size-6 transition-transform duration-200 group-hover:translate-x-1"
                        aria-hidden
                    />
                </Link>
                <div className="p-3">
                    <div className="mb-2">
                        <UserContact contactType={feedback.contactType} contactDetails={feedback.contactDetails} />
                    </div>
                    <div className="flex flex-col items-start bg-ax-bg-neutral-soft rounded-sm p-2">
                        <MultilineUserFeedback message={feedback.message} />
                    </div>
                    <Detail className="mt-2">
                        {formatDistanceToNowStrict(feedback.timestamp, { locale: nb, addSuffix: true })}
                    </Detail>
                </div>
            </div>
        </div>
    )
}

function UserContact({ contactType, contactDetails }: Pick<Feedback, 'contactType' | 'contactDetails'>): ReactElement {
    switch (contactType) {
        case 'NONE': {
            return (
                <Detail className="flex items-center gap-1 ml-1">
                    <CircleSlashIcon aria-hidden />
                    Bruker ønsker ikke å bli kontaktet
                </Detail>
            )
        }
        case 'EMAIL': {
            return (
                <Detail className="flex items-center gap-1 ml-1 flex-wrap">
                    <EnvelopeClosedIcon aria-hidden className="-mt-0.5" />
                    Bruker vil bli kontaktet via e-post:{' '}
                    <span className="bg-ax-bg-sunken px-1 rounded-sm">{contactDetails}</span>
                </Detail>
            )
        }
        case 'PHONE': {
            return (
                <Detail className="flex items-center gap-1 ml-1">
                    <PhoneIcon aria-hidden />
                    Bruker vil bli kontaktet via telefon:{' '}
                    <span className="bg-ax-bg-sunken px-1 rounded-sm">{contactDetails}</span>
                </Detail>
            )
        }
    }
}
