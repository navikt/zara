import React, { ReactElement } from 'react'
import { Detail, Heading } from '@navikt/ds-react'
import { ArrowRightIcon, CircleSlashIcon, EnvelopeClosedIcon, PhoneIcon } from '@navikt/aksel-icons'
import Link from 'next/link'
import { formatDistanceToNowStrict } from 'date-fns'
import { nb } from 'date-fns/locale'

import { Feedback } from '@services/feedback/feedback-schema'
import { MultilineUserFeedback } from '@components/feedback/MultilineUserFeedback'

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
                <div className="p-3 pt-0">
                    <div className="mb-3">
                        <UserContact contactType={feedback.contactType} />
                    </div>
                    <div className="relative flex flex-col items-start bg-ax-bg-neutral-soft rounded-sm p-2 min-h-32 max-h-32 overflow-hidden">
                        <MultilineUserFeedback message={feedback.message} />
                        <div className="absolute left-0 bottom-0 w-full pointer-events-none h-12 bg-linear-to-b from-transparent to-ax-bg-neutral-soft" />
                    </div>
                    <Detail className="mt-2">
                        {formatDistanceToNowStrict(feedback.timestamp, { locale: nb, addSuffix: true })}
                    </Detail>
                </div>
            </div>
        </div>
    )
}

function UserContact({ contactType }: Pick<Feedback, 'contactType'>): ReactElement {
    switch (contactType) {
        case 'NONE': {
            return (
                <Detail className="flex items-center gap-1 ml-1 italic">
                    <CircleSlashIcon aria-hidden />
                    Bruker ønsker ikke å bli kontaktet
                </Detail>
            )
        }
        case 'EMAIL': {
            return (
                <Detail className="flex items-center gap-1 ml-1 flex-wrap">
                    <EnvelopeClosedIcon aria-hidden className="-mt-0.5" />
                    Bruker vil bli kontaktet via e-post
                </Detail>
            )
        }
        case 'PHONE': {
            return (
                <Detail className="flex items-center gap-1 ml-1">
                    <PhoneIcon aria-hidden />
                    Bruker vil bli kontaktet via telefon
                </Detail>
            )
        }
    }
}
