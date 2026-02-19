import React, { Fragment, ReactElement, useState, useTransition } from 'react'
import { BodyShort, Button } from '@navikt/ds-react'
import * as R from 'remeda'
import { logger } from '@navikt/next-logger'
import { Feedback } from '@navikt/syk-zara/feedback'

import { cn } from '@lib/tw'

import { redactFeedbackContent } from './redaction-actions'
import { RedactedWord } from './Words'

type Props = {
    feedback: Feedback
    onRedactionDone: () => void
}

function RedactableUserFeedback({ feedback, onRedactionDone }: Props): ReactElement {
    const [redactedWords, setRedactedWords] = useState<Record<string, [number, number]>>({})
    const wordsByLines = feedback.message.split('\n').map((it) => it.split(' '))
    const [isPending, startTransition] = useTransition()

    return (
        <div>
            <div className="bg-ax-bg-sunken border border-ax-border-danger p-3 rounded-md drop-shadow-xl drop-shadow-ax-danger-600">
                {wordsByLines.map((words, lineIndex) => (
                    <BodyShort key={lineIndex} spacing={lineIndex < wordsByLines.length - 1}>
                        {words.map((word, wordIndex) => {
                            if (word === '<redacted>') {
                                return (
                                    <RedactedWord
                                        key={wordIndex}
                                        seed={lineIndex + wordIndex}
                                        type="already-redacted"
                                    />
                                )
                            }

                            const wordKey = `${lineIndex}:${wordIndex}`
                            return (
                                <Fragment key={wordIndex}>
                                    <button
                                        className={cn(
                                            'cursor-pointer inline-block hover:bg-ax-text-meta-purple-decoration',
                                            {
                                                'bg-ax-text-neutral hover:bg-ax-text-meta-purple-decoration':
                                                    redactedWords[wordKey],
                                            },
                                        )}
                                        onClick={() => {
                                            setRedactedWords((prev) => {
                                                if (prev[wordKey]) return R.omit(prev, [wordKey])

                                                return { ...prev, [wordKey]: [lineIndex, wordIndex] }
                                            })
                                        }}
                                    >
                                        {word}
                                    </button>{' '}
                                </Fragment>
                            )
                        })}
                    </BodyShort>
                ))}
            </div>
            <div className="mt-6 flex gap-4 justify-end">
                <Button
                    variant="danger"
                    size="small"
                    loading={isPending}
                    onClick={() => {
                        // No changes, just close redact mode
                        if (R.keys(redactedWords).length === 0) {
                            onRedactionDone()
                            return
                        }

                        startTransition(async () => {
                            try {
                                await redactFeedbackContent(feedback.id, R.values(redactedWords))
                                onRedactionDone()
                            } catch (e) {
                                logger.error(e)
                            }
                        })
                    }}
                >
                    Lagre sladding
                </Button>
                <Button
                    disabled={isPending}
                    variant="secondary"
                    data-color="neutral"
                    size="small"
                    onClick={() => onRedactionDone()}
                >
                    Avbryt
                </Button>
            </div>
        </div>
    )
}

export default RedactableUserFeedback
