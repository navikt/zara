'use client'

import React, { ReactElement, useState } from 'react'
import { Button, TextField } from '@navikt/ds-react'
import { useQueryState } from 'nuqs'

function KafkaConsumerGroupForm(): ReactElement {
    const [initialValue, setQuery] = useQueryState('group', { shallow: false })
    const [value, setValue] = useState(initialValue ?? '')

    const search = (): void => {
        const groupId = value.trim()
        if (groupId.length > 0) {
            setQuery(groupId)
        }
    }

    return (
        <div className="max-w-prose">
            <TextField
                label="Søk på consumer group"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        search()
                    }
                }}
            />
            <div className="mt-4">
                <Button onClick={search}>Søk på consumer group</Button>
            </div>
        </div>
    )
}

export default KafkaConsumerGroupForm
