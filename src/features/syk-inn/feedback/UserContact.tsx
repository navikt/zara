import React, { ReactElement } from 'react'
import {
    CheckmarkCircleIcon,
    CircleSlashIcon,
    EnvelopeClosedIcon,
    InformationSquareIcon,
    PhoneIcon,
} from '@navikt/aksel-icons'
import { BodyShort, CopyButton, Detail } from '@navikt/ds-react'

import { Feedback } from '@services/feedback/feedback-schema'
import { toReadableDateTime } from '@lib/date'

export function UserContact({
    contactType,
    contactDetails,
    contactedAt,
    contactedBy,
}: Pick<Feedback, 'contactType' | 'contactDetails' | 'contactedAt' | 'contactedBy'>): ReactElement {
    switch (contactType) {
        case 'NONE': {
            return (
                <div>
                    <div className="flex gap-3 p-2">
                        <CircleSlashIcon aria-hidden className="mt-0.5" />
                        <BodyShort className="italic">
                            Bruker har valgt å ikke bli kontaktet om denne tilbakemeldingen
                        </BodyShort>
                    </div>
                </div>
            )
        }
        case 'EMAIL': {
            return (
                <div>
                    <BodyShort spacing>Bruker har valgt å bli kontaktet via e-post</BodyShort>
                    <UserContactStatus contactedAt={contactedAt} contactedBy={contactedBy} />
                    <UserContactDetails Icon={EnvelopeClosedIcon} title="Epost" details={contactDetails} />
                </div>
            )
        }
        case 'PHONE': {
            return (
                <div>
                    <BodyShort spacing>Bruker har valgt å bli kontaktet via telefon</BodyShort>
                    <UserContactStatus contactedAt={contactedAt} contactedBy={contactedBy} />
                    <UserContactDetails Icon={PhoneIcon} title="Telefonnummer" details={contactDetails} />
                </div>
            )
        }
    }
}

function UserContactStatus({ contactedAt, contactedBy }: Pick<Feedback, 'contactedAt' | 'contactedBy'>): ReactElement {
    return (
        <div>
            <Detail className="flex gap-1 items-center font-bold">
                <InformationSquareIcon aria-hidden className="-mt-0.5" />
                Status
            </Detail>
            {contactedAt != null ? (
                <div>
                    <div className="flex gap-1 items-center">
                        Bruker ble kontaktet <span>{toReadableDateTime(contactedAt)}</span>
                        <CheckmarkCircleIcon />
                    </div>
                    <div className="text-sm">av {contactedBy}</div>
                </div>
            ) : (
                <div>A</div>
            )}
        </div>
    )
}

function UserContactDetails({
    Icon,
    title,
    details,
}: {
    Icon: typeof EnvelopeClosedIcon
    title: string
    details: string | null
}): ReactElement {
    return (
        <div>
            <Detail className="flex gap-1 items-center font-bold">
                <Icon aria-hidden />
                {title}
            </Detail>
            <div className="flex gap-3 items-center p-2">
                <div className="bg-ax-bg-sunken px-1 rounded-sm w-fit">{details ?? 'Ikke oppgitt'}</div>
                {details && <CopyButton copyText={details} size="xsmall" />}
            </div>{' '}
        </div>
    )
}
