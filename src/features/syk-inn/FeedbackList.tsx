import React, { ReactElement } from 'react'
import { BodyShort, Detail, Heading } from '@navikt/ds-react'
import { formatDistanceToNowStrict } from 'date-fns'
import { nb } from 'date-fns/locale'
import Image from 'next/image'

import { Feedback } from '../../services/feedback/feedback-client'
import sadSara from '../../images/sad-sara.webp'

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
                    <Image src={sadSara.src} width={256} height={256} alt="Zara!" />
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-3">
                    {feedback.map((it) => (
                        <div key={it.id}>
                            <div className="bg-ax-bg-raised border border-ax-border-neutral-subtle rounded-md p-3 flex flex-col justify-between">
                                <Heading size="xsmall" spacing>
                                    Tilbakemelding fra {it.name}
                                </Heading>
                                <div className="flex flex-col items-start bg-ax-bg-neutral-soft rounded-sm p-2">
                                    <MultilineUserFeedback message={it.message} />
                                </div>
                                <Detail className="mt-2">
                                    {formatDistanceToNowStrict(it.timestamp, { locale: nb, addSuffix: true })}
                                </Detail>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    )
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
