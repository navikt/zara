'use client'

import React, { ReactElement } from 'react'
import { BodyShort, Button, Heading } from '@navikt/ds-react'
import Image from 'next/image'
import * as R from 'remeda'
import { isToday } from 'date-fns'
import { GavelFillIcon } from '@navikt/aksel-icons'
import Link from 'next/link'

import { Feedback } from '@services/feedback/feedback-schema'

import { zaraImages } from '../../images/zaras'

import { FeedbackCard } from './FeedbackCard'
import FeedbackToday from './FeedbackToday'

type Props = {
    feedback: Feedback[]
}

function FeedbackList({ feedback }: Props): ReactElement {
    const feedbackToBeVerified = R.filter(feedback, (it) => it.verifiedContentAt == null).length

    return (
        <section aria-labelledby="all-feedback-heading">
            <div className="flex justify-between items-start">
                <Heading id="all-feedback-heading" level="3" size="medium" spacing className="ml-3">
                    Alle tilbakemeldinger ({feedback.length})
                </Heading>
                <Button
                    icon={<GavelFillIcon aria-hidden />}
                    variant="secondary"
                    size="small"
                    as={Link}
                    href="/syk-inn/tilbakemeldinger/personvernsmodus"
                >
                    {`Gå i personvernmodus!${feedbackToBeVerified > 0 ? ` (${feedbackToBeVerified})` : ''}`}
                </Button>
            </div>
            <FeedbackChunked feedback={feedback} />
        </section>
    )
}

function FeedbackChunked({ feedback }: Props): ReactElement {
    const [today, older] = R.partition(feedback, (it) => isToday(it.timestamp))

    return (
        <>
            <FeedbackToday today={today} />
            <Heading id="all-feedback-heading" level="4" size="small" spacing className="mt-6 ml-3">
                Tidligere ({older.length})
            </Heading>
            <div className="gap-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {older.map((it) => (
                    <FeedbackCard key={it.id} feedback={it} fresh={false} />
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
