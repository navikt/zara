import React, { ReactElement, useEffect, useState, useTransition } from 'react'
import { logger } from '@navikt/next-logger'
import { BodyShort, Button, Detail, Loader, Modal } from '@navikt/ds-react'
import Link from 'next/link'
import { TrashIcon } from '@navikt/aksel-icons'

import { feedbackUpdated } from './live-actions'

type Props = {
    id: string
}

function LiveChanges({ id }: Props): ReactElement {
    const { loading, hasBeenDeleted } = useLiveChanges(id)

    return (
        <>
            {hasBeenDeleted && (
                <Modal
                    header={{
                        icon: <TrashIcon aria-hidden />,
                        heading: 'Denne tilbakemeldinen har blitt slettet',
                        closeButton: false,
                    }}
                    open
                    onClose={() => void 0}
                    onBeforeClose={() => false}
                    onKeyDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                    }}
                    closeOnBackdropClick={false}
                    width="medium"
                >
                    <Modal.Body>
                        <BodyShort>Noen andre (eller deg i en annen tab!) har slettet denne sykmeldingen.</BodyShort>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button type="button" as={Link} href="/syk-inn/tilbakemeldinger">
                            Tilbake til oversikt
                        </Button>
                    </Modal.Footer>
                </Modal>
            )}
            {loading && (
                <div className="flex gap-3 justify-center items-center">
                    <Loader size="small" />
                    <div>
                        <Detail>Oppdateres</Detail>
                        <Detail className="italic text-xs -mt-1">Noen har endret noe!</Detail>
                    </div>
                </div>
            )}
        </>
    )
}

function useLiveChanges(id: string): {
    loading: boolean
    hasBeenDeleted: boolean
} {
    const [deleted, setDeleted] = useState(false)
    const [isPending, startTransition] = useTransition()

    useEffect(() => {
        const es = new EventSource(`/syk-inn/tilbakemeldinger/${id}/live`)

        es.onmessage = (e) => {
            const payload = JSON.parse(e.data)

            switch (payload.type) {
                case 'updated':
                    logger.info(`Got updated event for ${id}, let's reload the data!`)
                    startTransition(async () => {
                        await feedbackUpdated(id)
                    })
                    break
                case 'deleted':
                    logger.info(`Got deleted event for ${id}`)
                    setDeleted(true)
                    break
                default:
                    logger.info(`Got event ${payload.type}, not sure what to do`)
            }
        }

        return () => {
            es.close()
        }
    }, [id])

    return {
        loading: isPending,
        hasBeenDeleted: deleted,
    }
}

export default LiveChanges
