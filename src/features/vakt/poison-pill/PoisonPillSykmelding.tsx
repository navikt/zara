'use client'

import React, { ReactElement, useState, useTransition } from 'react'
import { Button, LocalAlert, Modal, TextField } from '@navikt/ds-react'
import { ExclamationmarkTriangleIcon } from '@navikt/aksel-icons'

import { markSykmeldingPoisonPill } from './poison-pill-actions'

function PoisonPillSykmelding(): ReactElement {
    const [isPending, startTransition] = useTransition()
    const [success, setSuccess] = useState<string | null>(null)
    const [state, setState] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [modalOpen, setModalState] = useState(false)

    return (
        <div>
            <div className="max-w-prose">
                <TextField
                    label="UUID for sykmelding som skal registreres som 'poison pill' i moderne flyt"
                    error={error}
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                />

                <div className="mt-4">
                    <Button
                        data-color="danger"
                        onClick={() => {
                            if (state.length === 36) {
                                setModalState(true)
                                setError(null)
                            } else {
                                setError(`"${state || 'itj nå'}" ser ikke ut som en gyldig UUID`)
                            }
                        }}
                    >
                        Registrer poison pill
                    </Button>
                </div>
            </div>
            {success && (
                <LocalAlert status="success" className="max-w-prose mt-8">
                    <LocalAlert.Header>
                        <LocalAlert.Title>Poison pill lagret</LocalAlert.Title>
                    </LocalAlert.Header>
                    <LocalAlert.Content>det gikk bra ass</LocalAlert.Content>
                </LocalAlert>
            )}
            <Modal
                className="max-w-prose w-full"
                open={modalOpen}
                header={{
                    icon: <ExclamationmarkTriangleIcon aria-hidden />,
                    heading: 'Vil du slette denne tilbakemeldingen?',
                }}
                onClose={() => setModalState(false)}
            >
                <Modal.Body>
                    <div>Er du sikker på at du vil markere</div>
                    <pre className="bg-ax-accent-300 p-1 pb-0 rounded-md max-w-fit">{state}</pre>
                    <div>som en poison pill?</div>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        type="button"
                        variant="danger"
                        onClick={() => {
                            startTransition(async () => {
                                await markSykmeldingPoisonPill(state)

                                setSuccess(`Markerte ${state} som poison pill`)

                                setError(null)
                                setState('')
                                setModalState(false)
                            })
                        }}
                        loading={isPending}
                    >
                        Poison pill it!
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => setModalState(false)} disabled={isPending}>
                        Lukk
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    )
}

export default PoisonPillSykmelding
