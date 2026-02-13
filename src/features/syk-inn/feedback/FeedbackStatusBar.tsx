import { CheckmarkHeavyIcon, EnvelopeClosedIcon, PersonGavelIcon } from '@navikt/aksel-icons'
import React, { ReactElement } from 'react'
import { Detail, Tag, Tooltip } from '@navikt/ds-react'
import { Feedback } from '@navikt/syk-zara'

import { toReadableDateTime } from '@lib/date'
import { cn } from '@lib/tw'

import LiveChanges from './live-changes/LiveChanges'

export function StatusBar({ feedback }: { feedback: Feedback }): ReactElement {
    return (
        <div className="flex items-center pt-2 divide-x divide-solid divide-ax-border-neutral-subtle">
            <div className="px-3">
                {feedback.type === 'CONTACTABLE' && (
                    <Tooltip content="Sendt inn via tilbakemeldingsknappen">
                        <Tag size="small" variant="moderate" data-color="brand-blue">
                            Knapp
                        </Tag>
                    </Tooltip>
                )}
                {feedback.type === 'IN_SITU' && (
                    <Tooltip content={`Sendt inn via "${feedback.variant}"`}>
                        <Tag size="small" variant="moderate" data-color="brand-magenta">
                            {feedback.variant}
                        </Tag>
                    </Tooltip>
                )}
            </div>

            <StatusItem
                className="px-3"
                Icon={PersonGavelIcon}
                label="Personopplysninger"
                at={feedback.verifiedContentAt}
                by={feedback.verifiedContentBy}
            />
            {feedback.type === 'CONTACTABLE' && (
                <StatusItem
                    className="px-3"
                    Icon={EnvelopeClosedIcon}
                    label="Kontaktet bruker"
                    at={feedback.contactedAt}
                    by={feedback.contactedBy}
                />
            )}
            <LiveChanges id={feedback.id} className="px-3" />
        </div>
    )
}

function StatusItem({
    className,
    Icon,
    label,
    at,
    by,
}: {
    className?: string
    Icon: typeof EnvelopeClosedIcon
    label: string
    at: string | null
    by: string | null
}): ReactElement {
    return (
        <div className={cn('flex gap-3 justify-center items-center', className)}>
            <DoableIcon Icon={Icon} done={at != null} />
            <div>
                <Detail>{label}</Detail>
                {at != null ? (
                    <Detail className="italic text-xs -mt-1">
                        {toReadableDateTime(at)}, av {by}
                    </Detail>
                ) : (
                    <Detail className="italic text-xs -mt-1">Ikke utført</Detail>
                )}
            </div>
        </div>
    )
}

function DoableIcon({ Icon, done }: { Icon: typeof EnvelopeClosedIcon; done: boolean }): ReactElement {
    return (
        <div className="relative">
            <Icon aria-hidden className={cn('size-8', { 'opacity-50': done })} />
            {done && (
                <CheckmarkHeavyIcon
                    aria-hidden
                    className="absolute -bottom-1 -right-1 bg-ax-bg-success-soft text-ax-text-success-decoration rounded-full"
                />
            )}
        </div>
    )
}
