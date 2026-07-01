'use client'

import { Button, TextField } from '@navikt/ds-react'
import { useQueryState } from 'nuqs'
import React, { ReactElement, useState } from 'react'

function BehandlerLookupForm(): ReactElement {
    const [initialValue, setQuery] = useQueryState('hpr', { shallow: false })
    const [value, setValue] = useState(initialValue ?? '')

    return (
        <div className="max-w-prose">
            <TextField
                label="Søk på HPR-nummer"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        if (value.length > 3) {
                            void setQuery(value)
                        }
                    }
                }}
            />
            <div className="mt-4">
                <Button
                    onClick={() => {
                        if (value.length > 3) {
                            void setQuery(value)
                        }
                    }}
                >
                    Søk på HPR
                </Button>
            </div>
        </div>
    )
}

export default BehandlerLookupForm
