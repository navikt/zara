import { CheckmarkHeavyIcon, EnvelopeClosedIcon, PersonGavelIcon } from '@navikt/aksel-icons'
import React, { ReactElement } from 'react'
import { Detail } from '@navikt/ds-react'
import { Feedback } from '@navikt/syk-zara'

import { toReadableDateTime } from '@lib/date'
import { cn } from '@lib/tw'

import LiveChanges from './live-changes/LiveChanges'

export function StatusBar({
    id,
    contactedAt,
    contactedBy,
    verifiedContentAt,
    verifiedContentBy,
}: Pick<Feedback, 'id' | 'contactedAt' | 'contactedBy' | 'verifiedContentBy' | 'verifiedContentAt'>): ReactElement {
    return (
        <div className="flex gap-3 pt-2">
            <StatusItem
                Icon={PersonGavelIcon}
                label="Personopplysninger"
                at={verifiedContentAt}
                by={verifiedContentBy}
            />
            <StatusItem Icon={EnvelopeClosedIcon} label="Kontaktet bruker" at={contactedAt} by={contactedBy} />
            <LiveChanges id={id} />
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
