import React, { ReactElement } from 'react'
import { Feedback } from '@navikt/syk-zara'
import { BodyShort, Detail, Tooltip } from '@navikt/ds-react'
import { FaceCryIcon, FaceFrownIcon, FaceIcon, FaceLaughIcon, FaceSmileIcon } from '@navikt/aksel-icons'
import { motion } from 'motion/react'

import { cn } from '@lib/tw'

type Props = {
    feedback: Feedback
}

function FeedbackDetails({ feedback }: Props): ReactElement {
    const sentiment = feedback.sentiment

    return (
        <div>
            <Detail>Sentiment</Detail>
            {sentiment ? (
                <Tooltip
                    content={`Bruker ga denne vurderingen en opplevelse av ${sentiment}/5 (i smilefjes) ved innsending.`}
                    placement="bottom"
                >
                    <div className="p-3">
                        <div className="group rounded-lg bg-linear-to-r from-ax-text-danger-decoration via-[#ffcb6f] to-ax-bg-success-strong-pressed border-2 border-ax-border-neutral-subtle">
                            <div className="h-8 flex justify-between items-center">
                                <SentimentIcon level={1} sentiment={sentiment} Icon={FaceCryIcon} />
                                <SentimentIcon level={2} sentiment={sentiment} Icon={FaceFrownIcon} />
                                <SentimentIcon level={3} sentiment={sentiment} Icon={FaceIcon} />
                                <SentimentIcon level={4} sentiment={sentiment} Icon={FaceSmileIcon} />
                                <SentimentIcon level={5} sentiment={sentiment} Icon={FaceLaughIcon} />
                            </div>
                        </div>
                    </div>
                </Tooltip>
            ) : (
                <BodyShort className="italic" size="small">
                    Bruker registrerte ikke noe sentiment for denne tilbakemeldingen
                </BodyShort>
            )}
        </div>
    )
}

function SentimentIcon({
    Icon,
    className,
    level,
    sentiment,
}: {
    Icon: typeof FaceIcon
    level: number
    sentiment: number
    className?: string
}): ReactElement {
    const thisIsIt = sentiment === level

    return (
        <motion.div
            initial={thisIsIt ? { scale: 1 } : false}
            animate={thisIsIt ? { scale: 2 } : {}}
            transition={thisIsIt ? { type: 'spring', stiffness: 300, damping: 15 } : {}}
        >
            <Icon
                aria-hidden
                className={cn(className, 'size-8 rounded-full text-ax-text-neutral-contrast', {
                    'border-3 border-ax-bg-raised text-ax-text-neutral transition-transform group-hover:scale-120':
                        thisIsIt,
                    'bg-ax-danger-500': sentiment === 1 && level === 1,
                    'bg-ax-warning-600': sentiment === 2 && level === 2,
                    'bg-ax-info-500': sentiment === 3 && level === 3,
                    'bg-ax-success-300': sentiment === 4 && level === 4,
                    'bg-ax-success-900 text-ax-text-success-contrast': sentiment === 5 && level === 5,
                })}
            />
        </motion.div>
    )
}

export default FeedbackDetails
