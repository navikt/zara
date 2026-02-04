import React, { Fragment, ReactElement } from 'react'
import { BodyShort } from '@navikt/ds-react'

import { feedbackToWordsByLines } from '../../features/syk-inn/feedback/utils'
import { RedactedWord } from '../../features/syk-inn/feedback/redaction/Words'

export function MultilineUserFeedback({ message }: { message: string }): ReactElement {
    const wordsByLines = feedbackToWordsByLines(message)

    return (
        <>
            {wordsByLines.map((words, lineIndex) => (
                <BodyShort key={lineIndex} spacing={lineIndex < wordsByLines.length - 1}>
                    {words.map((word, wordIndex) => {
                        if (word === '<redacted>') {
                            return <RedactedWord seed={lineIndex + wordIndex} key={wordIndex} />
                        }

                        return (
                            <Fragment key={wordIndex}>
                                <span className="inline-block">{word}</span>{' '}
                            </Fragment>
                        )
                    })}
                </BodyShort>
            ))}
        </>
    )
}
