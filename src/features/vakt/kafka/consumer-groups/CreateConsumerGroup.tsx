'use client'

import { PlusIcon } from '@navikt/aksel-icons'
import { BodyShort, Button, Modal, Select, TextField } from '@navikt/ds-react'
import React, { ReactElement, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { ResetOffsetTarget } from '#services/kafka/types'

import { createGroup } from './kafka-actions'

type Props = {
    /**
     * Pre-fills the group ID every time the modal is opened.
     */
    initialGroupId?: string
    /**
     * Called with the (trimmed) group ID after the group has been created.
     */
    onCreated?: (groupId: string) => void
}

function CreateConsumerGroup({ initialGroupId, onCreated }: Props): ReactElement {
    const ref = useRef<HTMLDialogElement>(null)
    const [isPending, startTransition] = useTransition()
    const [groupId, setGroupId] = useState(initialGroupId ?? '')
    const [topic, setTopic] = useState('')
    const [target, setTarget] = useState<ResetOffsetTarget>('latest')

    const trimmedGroupId = groupId.trim()
    const trimmedTopic = topic.trim()

    return (
        <>
            <Button
                variant="secondary"
                icon={<PlusIcon aria-hidden />}
                onClick={() => {
                    setGroupId(initialGroupId?.trim() ?? '')
                    ref.current?.showModal()
                }}
            >
                Opprett consumer group
            </Button>
            <Modal ref={ref} className="max-w-prose w-full" header={{ heading: 'Opprett consumer group' }}>
                <Modal.Body>
                    <BodyShort spacing>
                        Oppretter en ny consumer group med committed offsets på valgt topic. Når appen starter med denne
                        group IDen fortsetter den derfra.
                    </BodyShort>
                    <div className="flex flex-col gap-4">
                        <TextField label="Group ID" value={groupId} onChange={(e) => setGroupId(e.target.value)} />
                        <TextField
                            label="Topic"
                            description="Fullt navn inkludert namespace, f.eks. tsm.mitt-topic"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                        />
                        <Select
                            label="Start fra"
                            value={target}
                            onChange={(e) => setTarget(e.target.value as ResetOffsetTarget)}
                        >
                            <option value={'latest' satisfies ResetOffsetTarget}>Latest (kun nye meldinger)</option>
                            <option value={'earliest' satisfies ResetOffsetTarget}>
                                Earliest (alle meldinger på topicet)
                            </option>
                        </Select>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        type="button"
                        loading={isPending}
                        disabled={!trimmedGroupId || !trimmedTopic}
                        onClick={() => {
                            startTransition(async () => {
                                const result = await createGroup(trimmedGroupId, trimmedTopic, target)
                                if (result.ok) {
                                    toast.success(`Opprettet ${trimmedGroupId} på ${trimmedTopic} fra ${target}`)
                                    ref.current?.close()
                                    setTopic('')
                                    onCreated?.(trimmedGroupId)
                                } else {
                                    toast.error(`Kunne ikke opprette consumer group: ${result.error}`)
                                }
                            })
                        }}
                    >
                        Opprett
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => ref.current?.close()} disabled={isPending}>
                        Avbryt
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    )
}

export default CreateConsumerGroup
