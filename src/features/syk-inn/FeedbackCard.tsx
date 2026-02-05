import React, { ReactElement } from 'react'
import { Detail, Heading, Tooltip } from '@navikt/ds-react'
import {
    ArrowRightIcon,
    CheckmarkHeavyIcon,
    CircleSlashIcon,
    EnvelopeClosedIcon,
    PersonGavelIcon,
    PhoneIcon,
} from '@navikt/aksel-icons'
import Link from 'next/link'

import { Feedback } from '@services/feedback/feedback-schema'
import { MultilineUserFeedback } from '@components/feedback/MultilineUserFeedback'
import { cn } from '@lib/tw'
import { toReadableDateTime } from '@lib/date'
import { AutoUpdatingDistance } from '@components/AutoUpdatingDistance'

export function FeedbackCard({ feedback, fresh }: { feedback: Feedback; fresh: boolean }): ReactElement {
    return (
        <div
            className={cn(
                'bg-ax-bg-raised border border-ax-border-neutral-subtle rounded-md flex flex-col justify-between overflow-hidden',
                { 'drop-shadow-xl drop-shadow-ax-meta-purple-500': fresh },
            )}
        >
            <Link
                href={`/syk-inn/tilbakemeldinger/${feedback.id}`}
                className="group px-3 py-2 flex justify-between hover:bg-ax-bg-meta-purple-moderate-hover"
            >
                <Heading size="xsmall">Tilbakemelding fra {feedback.name}</Heading>
                <ArrowRightIcon
                    className="size-6 transition-transform duration-200 group-hover:translate-x-1"
                    aria-hidden
                />
            </Link>
            <div className="p-3 pt-0">
                <div className="mb-3">
                    <UserContact contactType={feedback.contactType} />
                </div>
                <div className="relative flex flex-col items-start bg-ax-bg-neutral-soft rounded-sm p-2 min-h-32 max-h-32 overflow-hidden">
                    <MultilineUserFeedback message={feedback.message} />
                    <div className="absolute left-0 bottom-0 w-full pointer-events-none h-12 bg-linear-to-b from-transparent to-ax-bg-neutral-soft" />
                </div>
            </div>
            <div className="p-1 px-2 flex justify-between items-center">
                <AutoUpdatingDistance prefix="Skrevet " time={feedback.timestamp} />
                <div className="flex gap-2 -mt-2">
                    <Tooltip
                        content={
                            feedback.verifiedContentAt
                                ? `Verifisert av ${feedback.verifiedContentBy}, ${toReadableDateTime(feedback.verifiedContentAt)}`
                                : `Innhold ikke verifisert`
                        }
                    >
                        <StatusIcon Icon={PersonGavelIcon} done={!!feedback.verifiedContentAt} />
                    </Tooltip>
                    {feedback.contactType !== 'NONE' && (
                        <Tooltip
                            content={
                                feedback.contactedAt
                                    ? `Bruker kontaktet av ${feedback.contactedBy}, ${toReadableDateTime(feedback.contactedAt)}`
                                    : `Bruker ikke kontaktet`
                            }
                        >
                            <StatusIcon Icon={EnvelopeClosedIcon} done={!!feedback.contactedAt} />
                        </Tooltip>
                    )}
                </div>
            </div>
        </div>
    )
}

function UserContact({ contactType }: Pick<Feedback, 'contactType'>): ReactElement {
    switch (contactType) {
        case 'NONE': {
            return (
                <Detail className="flex items-center gap-1 ml-1 italic">
                    <CircleSlashIcon aria-hidden />
                    Bruker ønsker ikke å bli kontaktet
                </Detail>
            )
        }
        case 'EMAIL': {
            return (
                <Detail className="flex items-center gap-1 ml-1 flex-wrap">
                    <EnvelopeClosedIcon aria-hidden className="-mt-0.5" />
                    Bruker ønsker å bli kontaktet via e-post
                </Detail>
            )
        }
        case 'PHONE': {
            return (
                <Detail className="flex items-center gap-1 ml-1">
                    <PhoneIcon aria-hidden />
                    Bruker ønsker å bli kontaktet via telefon
                </Detail>
            )
        }
    }
}

function StatusIcon({ Icon, done }: { Icon: typeof EnvelopeClosedIcon; done: boolean }): ReactElement {
    return (
        <div className="relative size-6">
            <Icon
                aria-hidden
                className={cn('h-full w-full', {
                    'opacity-50': done,
                })}
            />
            {done && (
                <CheckmarkHeavyIcon
                    aria-hidden
                    className="size-3 absolute -bottom-1 -right-1 bg-ax-bg-success-soft text-ax-text-success-decoration rounded-full"
                />
            )}
        </div>
    )
}
