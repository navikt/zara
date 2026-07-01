import { Button, TextField } from '@navikt/ds-react'
import React, { PropsWithChildren, ReactElement } from 'react'

import { searchPerson } from './person-lookup-actions'

type Props = {
    label: string
    defaultIdent?: string
    path: `/vakt/${string}`
}

function PersonLookupForm({ label, defaultIdent, path, children }: PropsWithChildren<Props>): ReactElement {
    return (
        <form action={searchPerson} className="max-w-prose mb-4">
            <div className="flex gap-3 items-end">
                <TextField className="grow" label={label} name="ident" defaultValue={defaultIdent} />
                {children}
                <div>
                    <Button type="submit">Søk</Button>
                </div>
            </div>
            <input hidden name="path" value={path} readOnly />
        </form>
    )
}

export default PersonLookupForm
