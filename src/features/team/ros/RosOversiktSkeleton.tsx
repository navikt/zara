import { Skeleton } from '@navikt/ds-react'
import React, { ReactElement } from 'react'

export function RosOversiktSkeleton(): ReactElement {
    return (
        <div className="flex flex-col gap-10 mt-8">
            {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} variant="rounded" width="100%" className="h-screen" />
            ))}
        </div>
    )
}
