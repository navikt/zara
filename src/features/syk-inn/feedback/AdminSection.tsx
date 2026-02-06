import React, { PropsWithChildren, ReactElement, ReactNode } from 'react'
import { Heading } from '@navikt/ds-react'

import { cn } from '@lib/tw'

function AdminSection({
    heading,
    className,
    children,
}: PropsWithChildren<{
    heading: ReactNode | string
    className?: string
}>): ReactElement {
    return (
        <div className={cn('p-3 bg-ax-bg-raised border border-ax-border-neutral-subtle rounded-lg', className)}>
            {typeof heading === 'string' ? (
                <Heading size="small" level="4">
                    {heading}
                </Heading>
            ) : (
                heading
            )}
            <div className="mt-1">{children}</div>
        </div>
    )
}

export default AdminSection
