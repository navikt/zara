'use client'

import React, { ReactElement, useRef, useState, useTransition } from 'react'
import { Button, Detail, Heading } from '@navikt/ds-react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRightIcon } from '@navikt/aksel-icons'

import { Feedback } from '@services/feedback/feedback-schema'
import { AutoUpdatingDistance } from '@components/AutoUpdatingDistance'
import { MultilineUserFeedback } from '@components/feedback/MultilineUserFeedback'
import { cn } from '@lib/tw'
import { AkselNextLink } from '@components/AkselNextLink'

import { setFeedbackVerified } from '../../features/syk-inn/feedback/message/feedback-actions'

import styles from './PrivacyMode.module.css'

function PrivacyMode({ feedback }: { feedback: Feedback[] }): ReactElement {
    const stableList = useRef(feedback)
    const [currentCard, setCurrentCard] = useState(0)

    if (currentCard >= feedback.length) {
        return <div>I think u done</div>
    }

    return (
        <div className={cn(styles.root, 'flex items-center justify-center')}>
            <div className="relative w-150 h-90">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentCard}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        style={{ position: 'absolute' }}
                        className="h-full w-full"
                    >
                        <DeciderCard
                            feedback={stableList.current[currentCard]}
                            onDecided={() => setCurrentCard((it) => it + 1)}
                        />
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )
}

function DeciderCard({ feedback, onDecided }: { feedback: Feedback; onDecided: () => void }): ReactElement {
    const [isPending, startTransition] = useTransition()

    return (
        <div className="h-full w-full bg-ax-meta-purple-1000 rounded-md text-ax-text-meta-purple-contrast p-3 drop-shadow-xl drop-shadow-ax-meta-purple-900">
            <div className="flex justify-between items-start">
                <Heading level="3" size="small" spacing>
                    Tilbakemelding fra {feedback.name}
                </Heading>
                <AkselNextLink
                    href={`/syk-inn/tilbakemeldinger/${feedback.id}`}
                    className="text-ax-text-meta-purple-contrast mt-0.5"
                >
                    Detaljer
                    <ArrowRightIcon aria-hidden />
                </AkselNextLink>
            </div>

            <div className="relative flex flex-col items-start bg-ax-bg-meta-purple-soft text-ax-text-meta-purple rounded-sm p-2 min-h-40 max-h-40 overflow-auto">
                <MultilineUserFeedback message={feedback.message} />
            </div>

            <AutoUpdatingDistance prefix="Skrevet " time={feedback.timestamp} />

            <Detail className="mt-4 text-center">Har denne tilbakemeldingen noe personidentifiserende info?</Detail>
            <div className="my-2 flex gap-3 h-16">
                <Button
                    className="grow"
                    variant="primary"
                    loading={isPending}
                    onClick={() => {
                        startTransition(async () => {
                            await setFeedbackVerified(feedback.id)
                            onDecided()
                        })
                    }}
                >
                    Denne har ingen personinfo!
                </Button>
                <Button className="grow" variant="secondary" onClick={onDecided} disabled={isPending}>
                    Eeeeeh... Usikker, hopp over
                </Button>
            </div>
        </div>
    )
}

export default PrivacyMode
