'use client'

import { Button, TextField } from '@navikt/ds-react'
import { useQueryState } from 'nuqs'
import React, { ReactElement, useState } from 'react'

import CreateConsumerGroup from './CreateConsumerGroup'

function KafkaConsumerGroupForm(): ReactElement {
    const [initialValue, setQuery] = useQueryState('group', { shallow: false })
    const [value, setValue] = useState(initialValue ?? '')

    const search = (): void => {
        const groupId = value.trim()
        if (groupId.length > 0) {
            void setQuery(groupId)
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
            <div className="mt-4 flex gap-2 flex-wrap">
                <Button onClick={search}>Søk på consumer group</Button>
                <CreateConsumerGroup
                    initialGroupId={value}
                    onCreated={(groupId) => {
                        setValue(groupId)
                        void setQuery(groupId)
                    }}
                />
            </div>
        </div>
    )
}

export default KafkaConsumerGroupForm
