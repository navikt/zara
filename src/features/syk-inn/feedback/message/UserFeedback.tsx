import React, { ReactElement, useTransition } from 'react'
import { BodyShort, Button, Detail } from '@navikt/ds-react'
import { CheckmarkHeavyIcon } from '@navikt/aksel-icons'
import { Feedback } from '@navikt/syk-zara/feedback'

import { MultilineUserFeedback } from '@components/feedback/MultilineUserFeedback'
import { toReadableDateTime } from '@lib/date'

import { setFeedbackVerified } from './feedback-actions'

type Props = {
    feedback: Feedback
}

export function UserFeedback({ feedback }: Props): ReactElement {
    return (
        <div>
            <div className="bg-ax-bg-sunken border border-ax-border-neutral-subtle p-3 rounded-md">
                <MultilineUserFeedback message={feedback.message} />
            </div>
            <div className="mt-2">
                <MarkVerified feedback={feedback} />
            </div>
        </div>
    )
}

function MarkVerified({ feedback }: Props): ReactElement {
    if (feedback.verifiedContentAt != null) {
        return (
            <div className="ml-2">
                <Detail>
                    <CheckmarkHeavyIcon aria-hidden className="inline" />
                    Fri for personopplysninger
                </Detail>
                <BodyShort size="small" className="text-xs">
                    Sjekket av {feedback.verifiedContentBy}, {toReadableDateTime(feedback.verifiedContentAt)}
                </BodyShort>
            </div>
        )
    }
    return (
        <div className="ml-2 flex justify-start">
            <VerificationButton id={feedback.id} />
        </div>
    )
}

function VerificationButton({ id }: { id: string }): ReactElement {
    const [isPending, startTransition] = useTransition()

    return (
        <Button
            size="small"
            variant="secondary"
            data-color="neutral"
            icon={<CheckmarkHeavyIcon aria-hidden className="inline" />}
            loading={isPending}
            onClick={async () => {
                startTransition(async () => {
                    await setFeedbackVerified(id)
                })
            }}
        >
            Tilbakemeldingen har ingen personopplysninger
        </Button>
    )
}
