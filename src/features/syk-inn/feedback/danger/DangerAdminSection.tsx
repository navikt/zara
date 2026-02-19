import React, { ReactElement, useRef, useTransition } from 'react'
import { BodyShort, Button, Detail, Link as AkselLink, LocalAlert, Modal } from '@navikt/ds-react'
import { ExclamationmarkTriangleIcon, TrashIcon } from '@navikt/aksel-icons'
import { Feedback } from '@navikt/syk-zara/feedback'
import { toast } from 'sonner'

import { MultilineUserFeedback } from '@components/feedback/MultilineUserFeedback'
import { toReadableDateTime } from '@lib/date'

import { deleteFeedbackPermanently, shareToSlack } from './danger-actions'

type Props = {
    feedback: Feedback
}

function DangerAdminSection({ feedback }: Props): ReactElement {
    return (
        <div className="mt-2 flex flex-col gap-4">
            <div className="bg-ax-bg-sunken p-3 rounded-md">
                <ShareToSlack feedback={feedback} />
            </div>
            <div className="bg-ax-bg-sunken p-3 rounded-md">
                <DeleteFeedback feedback={feedback} />
            </div>
        </div>
    )
}

function ShareToSlack({ feedback }: { feedback: Feedback }): ReactElement {
    const [isPending, startTransition] = useTransition()

    const needsVerification = feedback.verifiedContentAt == null

    return (
        <>
            <Detail spacing>Del på Slack</Detail>
            {feedback.sharedAt != null && (
                <>
                    <BodyShort spacing>
                        Tilbakemeldingen ble delt på Slack av {feedback.sharedBy ?? 'ukjent'},{' '}
                        {toReadableDateTime(feedback.sharedAt)}
                    </BodyShort>
                    {feedback.sharedLink && (
                        <AkselLink
                            href={feedback.sharedLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm"
                        >
                            Gå til diskusjonen på slack →
                        </AkselLink>
                    )}
                </>
            )}
            {feedback.sharedAt == null && (
                <>
                    <BodyShort spacing>Del denne tilbakemeldingen på Slack for å forke ut diskusjonen.</BodyShort>
                    <Button
                        size="small"
                        variant="secondary"
                        icon={<TrashIcon />}
                        disabled={needsVerification}
                        onClick={() => {
                            startTransition(async () => {
                                try {
                                    await shareToSlack(feedback.id)
                                } catch (e) {
                                    toast.custom((id) => (
                                        <LocalAlert key={id} status="error">
                                            <LocalAlert.Header>
                                                <LocalAlert.Title>Ulovlig!!</LocalAlert.Title>
                                            </LocalAlert.Header>
                                            <LocalAlert.Content>
                                                <BodyShort spacing>
                                                    Du kan ikke dele en tilbakemelding som ikke er bekreftet fri for
                                                    personopplysninger.
                                                </BodyShort>
                                                <Detail>Faktisk feil: {(e as Error).message}</Detail>
                                            </LocalAlert.Content>
                                        </LocalAlert>
                                    ))
                                }
                            })
                        }}
                        loading={isPending}
                    >
                        Del til #team-symfoni-zara
                    </Button>
                </>
            )}
            {needsVerification && (
                <Detail spacing className="flex items-center gap-1 mt-1">
                    <ExclamationmarkTriangleIcon aria-hidden />
                    Må verifiseres før den kan deles
                </Detail>
            )}
        </>
    )
}

function DeleteFeedback({ feedback }: { feedback: Feedback }): ReactElement {
    const ref = useRef<HTMLDialogElement>(null)
    const [isPending, startTransition] = useTransition()

    return (
        <>
            <Detail spacing>Noe feil? Du kan slette tilbakemeldingen. Denne handlingen kan ikke reverseres.</Detail>
            <Button size="small" variant="danger" icon={<TrashIcon />} onClick={() => ref.current?.showModal()}>
                Slett tilbakemeldingen
            </Button>
            <Modal
                className="max-w-prose w-full"
                ref={ref}
                header={{
                    icon: <ExclamationmarkTriangleIcon aria-hidden />,
                    heading: 'Vil du slette denne tilbakemeldingen?',
                }}
            >
                <Modal.Body>
                    <div className="bg-ax-bg-sunken border border-ax-border-neutral-subtle p-3 rounded-md">
                        <MultilineUserFeedback message={feedback.message} />
                    </div>
                    <Detail className="mt-2 ml-2">
                        av {feedback.name}, sendt inn {toReadableDateTime(feedback.timestamp)}
                    </Detail>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        type="button"
                        variant="danger"
                        onClick={() => {
                            startTransition(async () => {
                                await deleteFeedbackPermanently(feedback.id)
                            })
                        }}
                        loading={isPending}
                    >
                        Slett tilbakemeldingen
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => ref.current?.close()} disabled={isPending}>
                        Lukk
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    )
}

export default DangerAdminSection
