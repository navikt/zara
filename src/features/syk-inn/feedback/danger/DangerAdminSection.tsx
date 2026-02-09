import React, { ReactElement, useRef, useTransition } from 'react'
import { Button, Detail, Modal } from '@navikt/ds-react'
import { ExclamationmarkTriangleIcon, TrashIcon } from '@navikt/aksel-icons'
import { Feedback } from '@navikt/syk-zara'

import { MultilineUserFeedback } from '@components/feedback/MultilineUserFeedback'
import { toReadableDateTime } from '@lib/date'

import { deleteFeedbackPermanently } from './danger-actions'

type Props = {
    feedback: Feedback
}

function DangerAdminSection({ feedback }: Props): ReactElement {
    const ref = useRef<HTMLDialogElement>(null)
    const [isPending, startTransition] = useTransition()

    return (
        <div className="mt-2">
            <div className="bg-ax-bg-sunken p-3 rounded-md">
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
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => ref.current?.close()}
                            disabled={isPending}
                        >
                            Lukk
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        </div>
    )
}

export default DangerAdminSection
