'use client'

import { ArrowUndoIcon, ExclamationmarkTriangleIcon, TrashIcon } from '@navikt/aksel-icons'
import { BodyShort, Button, Detail, Modal, Select } from '@navikt/ds-react'
import React, { ReactElement, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { ResetOffsetTarget } from '#services/kafka/types'

import { deleteTopicOffsets, resetTopicOffsets } from './kafka-actions'

type Props = {
    groupId: string
    topic: string
    active: boolean
}

function TopicOffsetActions({ groupId, topic, active }: Props): ReactElement {
    return (
        <div className="flex gap-2 justify-end shrink-0">
            <ResetTopicOffsetsAction groupId={groupId} topic={topic} active={active} />
            <DeleteTopicOffsetsAction groupId={groupId} topic={topic} />
        </div>
    )
}

function ResetTopicOffsetsAction({ groupId, topic, active }: Props): ReactElement {
    const ref = useRef<HTMLDialogElement>(null)
    const [isPending, startTransition] = useTransition()
    const [target, setTarget] = useState<ResetOffsetTarget>('earliest')

    return (
        <>
            <Button
                size="xsmall"
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
                    heading: 'Reset offsets',
                }}
            >
                <Modal.Body>
                    <BodyShort spacing>
                        Flytter committed offsets for <span className="font-mono">{groupId}</span> på{' '}
                        <span className="font-mono">{topic}</span>. Gruppens andre topics påvirkes ikke.
                    </BodyShort>
                    <Select
                        label="Reset til"
                        value={target}
                        onChange={(e) => setTarget(e.target.value as ResetOffsetTarget)}
                    >
                        <option value={'earliest' satisfies ResetOffsetTarget}>Earliest (start på topic)</option>
                        <option value={'latest' satisfies ResetOffsetTarget}>Latest (slutt på topic)</option>
                    </Select>
                    <Detail className="mt-4">Gruppen må være inaktiv (ingen tilkoblede medlemmer).</Detail>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        type="button"
                        variant="danger"
                        loading={isPending}
                        onClick={() => {
                            startTransition(async () => {
                                const result = await resetTopicOffsets(groupId, topic, target)
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

function DeleteTopicOffsetsAction({ groupId, topic }: Omit<Props, 'active'>): ReactElement {
    const ref = useRef<HTMLDialogElement>(null)
    const [isPending, startTransition] = useTransition()

    return (
        <>
            <Button
                size="xsmall"
                variant="danger"
                icon={<TrashIcon aria-hidden />}
                onClick={() => ref.current?.showModal()}
            >
                Slett offsets
            </Button>
            <Modal
                ref={ref}
                className="max-w-prose w-full"
                header={{
                    icon: <ExclamationmarkTriangleIcon aria-hidden />,
                    heading: 'Slett offsets?',
                }}
            >
                <Modal.Body>
                    <BodyShort spacing>
                        Fjerner committed offsets for <span className="font-mono">{groupId}</span> på{' '}
                        <span className="font-mono">{topic}</span>. Gruppens andre topics påvirkes ikke. Denne
                        handlingen kan ikke reverseres.
                    </BodyShort>
                    <BodyShort spacing>
                        Neste gang gruppen leser fra topicet starter den der consumerens{' '}
                        <span className="font-mono">auto.offset.reset</span> sier.
                    </BodyShort>
                    <Detail>
                        Kafka avviser slettingen hvis gruppen har aktive consumere som abonnerer på topicet.
                    </Detail>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        type="button"
                        variant="danger"
                        loading={isPending}
                        onClick={() => {
                            startTransition(async () => {
                                const result = await deleteTopicOffsets(groupId, topic)
                                if (result.ok) {
                                    toast.success(`Slettet offsets for ${groupId} på ${topic}`)
                                    ref.current?.close()
                                } else {
                                    toast.error(`Kunne ikke slette offsets: ${result.error}`)
                                }
                            })
                        }}
                    >
                        Slett offsets
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => ref.current?.close()} disabled={isPending}>
                        Avbryt
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    )
}

export default TopicOffsetActions
