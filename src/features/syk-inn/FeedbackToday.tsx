'use client'

import React, { ReactElement, useCallback, useEffect, useState } from 'react'
import { BodyShort, Heading } from '@navikt/ds-react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'motion/react'

import { Feedback } from '@services/feedback/feedback-schema'

import { zaraImages } from '../../images/zaras'

import { FeedbackCard } from './FeedbackCard'

function FeedbackToday({ today }: { today: Feedback[] }): ReactElement {
    const [allToday, setAllToday] = useState(today)
    const newFeedback = useCallback((feedback: Feedback): void => {
        setAllToday((prev) => [feedback, ...prev])
    }, [])

    useLiveFeedback(newFeedback)

    return (
        <>
            <Heading id="all-feedback-heading" level="4" size="small" spacing className="ml-3">
                I dag ({allToday.length})
            </Heading>
            <motion.div className="gap-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence initial={false}>
                    {allToday.map((it) => (
                        <motion.div
                            key={it.id}
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            transition={{ duration: 0.25 }}
                        >
                            <FeedbackCard feedback={it} fresh={'funkyFresh' in it} />
                        </motion.div>
                    ))}
                </AnimatePresence>
                {allToday.length === 0 && (
                    <div className="p-4 bg-ax-bg-raised border border-ax-border-neutral-subtle rounded-md flex gap-4 items-center justify-start">
                        <Image src={zaraImages.mad.src} width={64} height={64} alt="" />
                        <BodyShort size="large" className="text-ax-text-neutral-subtle">
                            Ingen tilbakemeldinger i dag
                        </BodyShort>
                    </div>
                )}
            </motion.div>
        </>
    )
}

function useLiveFeedback(newFeedback: (feedback: Feedback) => void): void {
    useEffect(() => {
        const es = new EventSource(`/syk-inn/tilbakemeldinger/live`)

        es.onmessage = (e) => {
            const payload = JSON.parse(e.data)

            newFeedback({ ...payload, funkyFresh: true } as Feedback)
        }

        return () => {
            es.close()
        }
    }, [newFeedback])
}

export default FeedbackToday
