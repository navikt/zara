import React, { ReactElement, useTransition } from 'react'
import {
    CheckmarkHeavyIcon,
    CircleSlashIcon,
    EnvelopeClosedIcon,
    InformationSquareIcon,
    PhoneIcon,
} from '@navikt/aksel-icons'
import { BodyShort, Button, CopyButton, Detail } from '@navikt/ds-react'
import { ContactableUserFeedback } from '@navikt/syk-zara'

import { toReadableDateTime } from '@lib/date'

import { setUserContacted } from './contact-actions'

type Props = {
    feedback: ContactableUserFeedback
}

export function UserContact({ feedback }: Props): ReactElement {
    switch (feedback.contactType) {
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
                    <BodyShort spacing>
                        Bruker {feedback.contactedAt == null ? 'ønsker' : 'ønsket'} å bli kontaktet via e-post
                    </BodyShort>
                    <div className="flex flex-col gap-3">
                        <UserContactStatus contactedAt={feedback.contactedAt} contactedBy={feedback.contactedBy} />
                        <UserContactDetails Icon={EnvelopeClosedIcon} title="Epost" details={feedback.contactDetails} />
                        {feedback.contactedAt == null && <UserContactedButton id={feedback.id} />}
                    </div>
                </div>
            )
        }
        case 'PHONE': {
            return (
                <div>
                    <BodyShort spacing>
                        Bruker {feedback.contactedAt == null ? 'ønsker' : 'ønsket'} å bli kontaktet via telefon
                    </BodyShort>
                    <div className="flex flex-col gap-3">
                        <UserContactStatus contactedAt={feedback.contactedAt} contactedBy={feedback.contactedBy} />
                        <UserContactDetails Icon={PhoneIcon} title="Telefonnummer" details={feedback.contactDetails} />
                        {feedback.contactedAt == null && <UserContactedButton id={feedback.id} />}
                    </div>
                </div>
            )
        }
    }
}

function UserContactStatus({
    contactedAt,
    contactedBy,
}: Pick<ContactableUserFeedback, 'contactedAt' | 'contactedBy'>): ReactElement {
    return (
        <div className="mb-2">
            <Detail className="flex gap-1 items-center font-bold">
                <InformationSquareIcon aria-hidden className="-mt-0.5" />
                Status
            </Detail>
            {contactedAt != null ? (
                <div className="p-2">
                    <BodyShort>
                        Bruker ble kontaktet <span>{toReadableDateTime(contactedAt)}</span>
                    </BodyShort>
                    <div className="text-sm">av {contactedBy}</div>
                </div>
            ) : (
                <BodyShort className="italic">Bruker er ikke kontaktet</BodyShort>
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

function UserContactedButton({ id }: { id: string }): ReactElement {
    const [isPending, startTransition] = useTransition()

    return (
        <Button
            size="small"
            variant="secondary"
            data-color="neutral"
            className="w-fit"
            icon={<CheckmarkHeavyIcon aria-hidden className="inline" />}
            loading={isPending}
            onClick={async () => {
                startTransition(async () => {
                    await setUserContacted(id)
                })
            }}
        >
            Bruker har blitt kontaktet
        </Button>
    )
}
