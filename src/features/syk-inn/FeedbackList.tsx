import React, { ReactElement } from 'react'
import { BodyShort, Detail, Heading } from '@navikt/ds-react'
import { formatDistanceToNowStrict } from 'date-fns'
import { nb } from 'date-fns/locale'
import Image from 'next/image'
import { ArrowRightIcon, CircleSlashIcon, EnvelopeClosedIcon, PhoneIcon } from '@navikt/aksel-icons'
import Link from 'next/link'

import { Feedback } from '../../services/feedback/feedback-client'
import { zaraImages } from '../../images/zaras'

type Props = {
    feedback: Feedback[]
}

function FeedbackList({ feedback }: Props): ReactElement {
    const hasFeedback = feedback.length > 0

    return (
        <section aria-labelledby="all-feedback-heading">
            <Heading id="all-feedback-heading" level="3" size="medium" spacing className="ml-3">
                Alle tilbakemeldinger ({feedback.length})
            </Heading>
            {!hasFeedback ? (
                <div className="bg-ax-bg-raised border border-ax-border-neutral-subtle max-w-prose rounded-md p-6 flex justify-center items-center h-96 flex-col">
                    <div className="text-4xl mb-4 text-ax-text-neutral-subtle">Ingen tilbakemeldinger enda :(</div>
                    <Image src={zaraImages.cry.src} width={256} height={256} alt="Zara!" />
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-3">
                    {feedback.map((it) => (
                        <FeedbackCard key={it.id} feedback={it} />
                    ))}
                </div>
            )}
        </section>
    )
}

function FeedbackCard({ feedback }: { feedback: Feedback }): ReactElement {
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

function MultilineUserFeedback({ message }: { message: string }): ReactElement {
    const lines = message.split('\n')
    return (
        <>
            {lines.map((line, index) => (
                <BodyShort key={index} spacing={index < lines.length - 1}>
                    {line}
                </BodyShort>
            ))}
        </>
    )
}

export default FeedbackList
