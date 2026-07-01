import { Heading } from '@navikt/ds-react'
import React, { PropsWithChildren, ReactElement } from 'react'

import { cn } from '#lib/tw'

type Props = {
    className?: string
    listClassName?: string
    title: string
}

export function DescriptiveList({ children, title, className, listClassName }: PropsWithChildren<Props>): ReactElement {
    return (
        <section aria-labelledby="pasient-informasjon" className={cn('p-2', className)}>
            <Heading size="xsmall" level="3" id="pasient-informasjon" className="ml-1">
                {title}
            </Heading>
            <dl
                className={cn(
                    'bg-ax-bg-raised border border-ax-border-neutral-subtle rounded-md p-2 pb-0',
                    listClassName,
                )}
            >
                {children}
            </dl>
        </section>
    )
}

export function DescriptiveItem({ title, children }: PropsWithChildren<{ title: string }>): ReactElement {
    return (
        <>
            <dt className="font-semibold">{title}</dt>
            <dd className="mb-4">{children}</dd>
        </>
    )
}

export function DescriptiveJson({ title, children }: { title: string; children: unknown }): ReactElement {
    return (
        <>
            <dt className="font-semibold">{title}</dt>
            <dd className="mb-4">
                <pre className="text-sm border border-ax-text-neutral-subtle overflow-scroll p-2 rounded-md">
                    {JSON.stringify(children, null, 2)}
                </pre>
            </dd>
        </>
    )
}
