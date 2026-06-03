import React, { ReactElement } from 'react'
import { Button, TextField } from '@navikt/ds-react'

import { searchPerson } from './person-lookup-actions'

function PersonLookupForm({ defaultIdent }: { defaultIdent?: string }): ReactElement {
    return (
        <form action={searchPerson} className="max-w-prose">
            <TextField label="Søk på ident" name="ident" defaultValue={defaultIdent} />
            <div className="mt-4">
                <Button type="submit">Søk på Ident</Button>
            </div>
        </form>
    )
}

export default PersonLookupForm
