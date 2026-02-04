import React, { ReactElement } from 'react'
import { CheckmarkHeavyIcon, EnvelopeClosedIcon, PersonGavelIcon } from '@navikt/aksel-icons'
import { Detail, Heading } from '@navikt/ds-react'

import { Feedback } from '@services/feedback/feedback-schema'
import { cn } from '@lib/tw'
import { toReadableDateTime } from '@lib/date'

import { UserContact } from './UserContact'
import UserFeedback from './UserFeedback'

type Props = {
    feedback: Feedback
}

function FeedbackAdmin({ feedback }: Props): ReactElement {
    return (
        <div className="flex flex-col gap-4">
            <StatusBar {...feedback} />
            <div>
                <Heading size="small" level="4" spacing>
                    Tilbakemelding
                </Heading>
                <UserFeedback message={feedback.message} />
            </div>

            <div>
                <Heading size="small" level="4">
                    Kontakt
                </Heading>
                <UserContact {...feedback} />
            </div>
        </div>
    )
}

function StatusBar({ contactedAt, contactedBy }: Pick<Feedback, 'contactedAt' | 'contactedBy'>): ReactElement {
    return (
        <div className="flex gap-3 pt-2">
            <StatusItem Icon={PersonGavelIcon} label="Personopplysninger" at={null} by={null} />
            <StatusItem Icon={EnvelopeClosedIcon} label="Kontaktet bruker" at={contactedAt} by={contactedBy} />
        </div>
    )
}

function StatusItem({
    Icon,
    label,
    at,
    by,
}: {
    Icon: typeof EnvelopeClosedIcon
    label: string
    at: string | null
    by: string | null
}): ReactElement {
    return (
        <div className="flex gap-3 justify-center items-center">
            <DoableIcon Icon={Icon} done={at != null} />
            <div>
                <Detail>{label}</Detail>
                {at != null ? (
                    <Detail className="italic text-xs -mt-1">
                        {toReadableDateTime(at)}, av {by}
                    </Detail>
                ) : (
                    <Detail className="italic text-xs -mt-1">Ikke sjekket</Detail>
                )}
            </div>
        </div>
    )
}

function DoableIcon({ Icon, done }: { Icon: typeof EnvelopeClosedIcon; done: boolean }): ReactElement {
    return (
        <div className="relative">
            <Icon
                aria-hidden
                className={cn('size-8', {
                    'opacity-50': done,
                })}
            />
            {done && (
                <CheckmarkHeavyIcon
                    aria-hidden
                    className="absolute -bottom-1 -right-1 bg-ax-bg-success-soft text-ax-text-success-decoration rounded-full"
                />
            )}
        </div>
    )
}

export default FeedbackAdmin
