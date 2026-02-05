import React, { ReactElement } from 'react'
import { BodyShort, Heading } from '@navikt/ds-react'
import Image from 'next/image'
import * as R from 'remeda'
import { isToday } from 'date-fns'

import { Feedback } from '@services/feedback/feedback-schema'

import { zaraImages } from '../../images/zaras'

import { FeedbackCard } from './FeedbackCard'

type Props = {
    feedback: Feedback[]
}

function FeedbackList({ feedback }: Props): ReactElement {
    return (
        <section aria-labelledby="all-feedback-heading">
            <Heading id="all-feedback-heading" level="3" size="medium" spacing className="ml-3">
                Alle tilbakemeldinger ({feedback.length})
            </Heading>
            <FeedbackChunked feedback={feedback} />
        </section>
    )
}

function FeedbackChunked({ feedback }: Props): ReactElement {
    const [today, older] = R.partition(feedback, (it) => isToday(it.timestamp))

    return (
        <>
            <Heading id="all-feedback-heading" level="4" size="small" spacing className="ml-3">
                I dag ({today.length})
            </Heading>
            <div className="gap-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {today.map((it) => (
                    <FeedbackCard key={it.id} feedback={it} />
                ))}
                {today.length === 0 && (
                    <div className="p-4 bg-ax-bg-raised border border-ax-border-neutral-subtle rounded-md flex gap-4 items-center justify-start">
                        <Image src={zaraImages.mad.src} width={64} height={64} alt="" />
                        <BodyShort size="large" className="text-ax-text-neutral-subtle">
                            Ingen tilbakemeldinger i dag
                        </BodyShort>
                    </div>
                )}
            </div>
            <Heading id="all-feedback-heading" level="4" size="small" spacing className="mt-6 ml-3">
                Tidligere ({older.length})
            </Heading>
            <div className="gap-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {older.map((it) => (
                    <FeedbackCard key={it.id} feedback={it} />
                ))}
                {older.length === 0 && (
                    <div className="p-4 bg-ax-bg-raised border border-ax-border-neutral-subtle rounded-md flex gap-4 items-center justify-start">
                        <Image src={zaraImages.mad.src} width={64} height={64} alt="" />
                        <BodyShort size="large" className="text-ax-text-neutral-subtle">
                            Ingen tidligere tilbakemeldinger
                        </BodyShort>
                    </div>
                )}
            </div>
        </>
    )
}

export default FeedbackList
