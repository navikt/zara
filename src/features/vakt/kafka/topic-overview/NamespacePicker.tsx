'use client'

import { Select } from '@navikt/ds-react'
import { parseAsStringLiteral, useQueryState } from 'nuqs'
import React, { ReactElement } from 'react'

const validOptions = ['tsm', 'teamsykmelding'] as const

export type ValidNamespaces = (typeof validOptions)[number]

export function NamespacePicker(): ReactElement {
    const [value, setValue] = useQueryState(
        'namespace',
        parseAsStringLiteral(validOptions).withDefault('tsm').withOptions({
            clearOnDefault: true,
            shallow: false,
        }),
    )

    return (
        <div className="max-w-sm mb-4">
            <Select label="Namespace" value={value} onChange={(e) => setValue(e.target.value as ValidNamespaces)}>
                <option value={'tsm' satisfies ValidNamespaces}>TSM</option>
                <option value={'teamsykmelding' satisfies ValidNamespaces}>teamsykmelding</option>
            </Select>
        </div>
    )
}
