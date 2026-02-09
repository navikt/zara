import React, { ReactElement } from 'react'
import {
    FaceCryIcon,
    FaceFrownIcon,
    FaceIcon,
    FaceLaughIcon,
    FaceSmileIcon,
    QuestionmarkIcon,
} from '@navikt/aksel-icons'

import { cn } from '@lib/tw'

type Props = {
    sentiment: number
    className?: string
}

function SentimentIcon({ sentiment, className }: Props): ReactElement {
    return <SentimentAkselIcon className={cn(className, 'rounded-full size-6 border')} sentiment={sentiment} />
}

function SentimentAkselIcon({ sentiment, className }: Props): ReactElement {
    switch (sentiment) {
        case 1:
            return <FaceCryIcon aria-hidden className={cn(className, 'bg-ax-danger-500 border-ax-danger-100')} />
        case 2:
            return <FaceFrownIcon aria-hidden className={cn(className, 'bg-ax-warning-600 border-ax-warning-100')} />
        case 3:
            return <FaceIcon aria-hidden className={cn(className, 'bg-ax-info-500 border-ax-info-100')} />
        case 4:
            return <FaceSmileIcon aria-hidden className={cn(className, 'bg-ax-success-300 border-ax-info-500')} />
        case 5:
            return (
                <FaceLaughIcon
                    aria-hidden
                    className={cn(className, 'bg-ax-success-900 text-ax-text-success-contrast border-ax-info-500')}
                />
            )
        default:
            return <QuestionmarkIcon aria-hidden className={cn(className, '')} />
    }
}

export default SentimentIcon
