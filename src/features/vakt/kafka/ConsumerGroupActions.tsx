'use client'

import React, { ReactElement, useRef, useState, useTransition } from 'react'
import { BodyShort, Button, Detail, Modal, Select, TextField } from '@navikt/ds-react'
import { ArrowUndoIcon, ExclamationmarkTriangleIcon, TrashIcon } from '@navikt/aksel-icons'
import { toast } from 'sonner'

import { ResetOffsetTarget } from '@services/kafka/types'

import { deleteGroup, resetOffsets } from './kafka-actions'

type Props = {
    groupId: string
    active: boolean
}

function ConsumerGroupActions({ groupId, active }: Props): ReactElement {
    return (
        <div className="flex gap-2 justify-end">
            <ResetOffsetsAction groupId={groupId} active={active} />
            <DeleteGroupAction groupId={groupId} active={active} />
        </div>
    )
}

function ResetOffsetsAction({ groupId, active }: Props): ReactElement {
    const ref = useRef<HTMLDialogElement>(null)
    const [isPending, startTransition] = useTransition()
    const [topic, setTopic] = useState('')
    const [target, setTarget] = useState<ResetOffsetTarget>('earliest')

    return (
        <>
            <Button
                size="small"
                variant="secondary"
                icon={<ArrowUndoIcon aria-hidden />}
                disabled={active}
                title={active ? 'Gruppen må være inaktiv for å resette offsets' : undefined}
                onClick={() => ref.current?.showModal()}
            >
                Reset offsets
            </Button>
            <Modal
                ref={ref}
                className="max-w-prose w-full"
                header={{
                    icon: <ExclamationmarkTriangleIcon aria-hidden />,
                    heading: `Reset offsets for ${groupId}`,
                }}
            >
                <Modal.Body>
                    <BodyShort spacing>
                        Dette flytter committed offsets for gruppen. Gruppen må være inaktiv (ingen tilkoblede
                        medlemmer).
                    </BodyShort>
                    <div className="flex flex-col gap-4">
                        <TextField
                            label="Topic"
                            description="Navnet på topicet offsets skal resettes for."
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                        />
                        <Select
                            label="Reset til"
                            value={target}
                            onChange={(e) => setTarget(e.target.value as ResetOffsetTarget)}
                        >
                            <option value="earliest">Earliest (start på topic)</option>
                            <option value="latest">Latest (slutt på topic)</option>
                        </Select>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        type="button"
                        variant="danger"
                        loading={isPending}
                        disabled={!topic}
                        onClick={() => {
                            startTransition(async () => {
                                const result = await resetOffsets(groupId, topic, target)
                                if (result.ok) {
                                    toast.success(`Resatt offsets for ${groupId} på ${topic} til ${target}`)
                                    ref.current?.close()
                                } else {
                                    toast.error(`Kunne ikke resette offsets: ${result.error}`)
                                }
                            })
                        }}
                    >
                        Reset offsets
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => ref.current?.close()} disabled={isPending}>
                        Avbryt
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    )
}

function DeleteGroupAction({ groupId, active }: Props): ReactElement {
    const ref = useRef<HTMLDialogElement>(null)
    const [isPending, startTransition] = useTransition()

    return (
        <>
            <Button
                size="small"
                variant="danger"
                icon={<TrashIcon aria-hidden />}
                disabled={active}
                title={active ? 'Gruppen må være inaktiv for å slettes' : undefined}
                onClick={() => ref.current?.showModal()}
            >
                Slett
            </Button>
            <Modal
                ref={ref}
                className="max-w-prose w-full"
                header={{
                    icon: <ExclamationmarkTriangleIcon aria-hidden />,
                    heading: `Slett consumer group ${groupId}?`,
                }}
            >
                <Modal.Body>
                    <BodyShort spacing>
                        Er du sikker på at du vil slette consumer group <span className="font-mono">{groupId}</span>?
                        Denne handlingen kan ikke reverseres.
                    </BodyShort>
                    <Detail>Gruppen må være inaktiv (ingen tilkoblede medlemmer) for å kunne slettes.</Detail>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        type="button"
                        variant="danger"
                        loading={isPending}
                        onClick={() => {
                            startTransition(async () => {
                                const result = await deleteGroup(groupId)
                                if (result.ok) {
                                    toast.success(`Slettet consumer group ${groupId}`)
                                    ref.current?.close()
                                } else {
                                    toast.error(`Kunne ikke slette gruppen: ${result.error}`)
                                }
                            })
                        }}
                    >
                        Slett consumer group
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => ref.current?.close()} disabled={isPending}>
                        Avbryt
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    )
}

export default ConsumerGroupActions
