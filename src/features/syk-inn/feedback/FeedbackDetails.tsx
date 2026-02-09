import React, { ReactElement } from 'react'
import { Feedback } from '@navikt/syk-zara'
import { BodyShort, Detail } from '@navikt/ds-react'
import { FaceCryIcon, FaceFrownIcon, FaceIcon, FaceLaughIcon, FaceSmileIcon } from '@navikt/aksel-icons'

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
                <div className="p-3">
                    <div className="rounded-lg bg-linear-to-r from-ax-text-danger-decoration via-[#ffcb6f] to-ax-bg-success-strong-pressed border-2 border-ax-border-neutral-subtle">
                        <div className="h-8 flex justify-between items-center">
                            <DaIcon it={sentiment === 1} level={sentiment} Icon={FaceCryIcon} />
                            <DaIcon it={sentiment === 2} level={sentiment} Icon={FaceFrownIcon} />
                            <DaIcon it={sentiment === 3} level={sentiment} Icon={FaceIcon} />
                            <DaIcon it={sentiment === 4} level={sentiment} Icon={FaceSmileIcon} />
                            <DaIcon it={sentiment === 5} level={sentiment} Icon={FaceLaughIcon} />
                        </div>
                    </div>
                </div>
            ) : (
                <BodyShort className="italic" size="small">
                    Bruker registrerte ikke noe sentiment for denne tilbakemeldingen
                </BodyShort>
            )}
        </div>
    )
}

function DaIcon({
    Icon,
    className,
    it,
    level,
}: {
    Icon: typeof FaceIcon
    it: boolean
    level: number
    className?: string
}): ReactElement {
    return (
        <Icon
            aria-hidden
            className={cn(className, 'size-8 rounded-full text-ax-text-neutral-contrast', {
                'scale-200 border-3 border-ax-bg-raised text-ax-text-neutral': it,
                'bg-ax-danger-500': it && level === 1,
                'bg-ax-warning-600': it && level === 2,
                'bg-ax-info-500': it && level === 3,
                'bg-ax-success-300': it && level === 4,
                'bg-ax-success-900 text-ax-text-success-contrast': it && level === 5,
            })}
        />
    )
}

export default FeedbackDetails
