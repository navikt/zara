import React, { ReactElement } from 'react'
import { Heading } from '@navikt/ds-react'
import Image from 'next/image'

import { Feedback } from '@services/feedback/feedback-schema'

import { zaraImages } from '../../images/zaras'

import { FeedbackCard } from './FeedbackCard'

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

export default FeedbackList
