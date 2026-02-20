'use client'

import { Button } from '@navikt/ds-react'
import { ReactElement, useTransition } from 'react'
import { BedIcon, Buildings3Icon } from '@navikt/aksel-icons'

import { registerKontor } from '@features/team/kontor/kontor-actions'

function SelfRegisterButtons(): ReactElement {
    const [isPending, startTransition] = useTransition()

    return (
        <div className="flex gap-4 justify-center">
            <Button
                data-color="brand-magenta"
                icon={<BedIcon />}
                loading={isPending}
                onClick={() => startTransition(async () => registerKontor('remote'))}
            >
                Registrer meg som remote!
            </Button>
            <Button
                data-color="brand-blue"
                icon={<Buildings3Icon />}
                loading={isPending}
                onClick={() => startTransition(async () => registerKontor('office'))}
            >
                Registrer meg som Oslo!
            </Button>
        </div>
    )
}

export default SelfRegisterButtons
