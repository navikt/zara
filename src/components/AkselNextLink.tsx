'use client'

import { Button, ButtonProps, Link as AkselLink, Tooltip } from '@navikt/ds-react'
import React, { PropsWithChildren, ReactElement } from 'react'
import Link from 'next/link'

export function AkselNextLink({
    children,
    href,
    className,
}: PropsWithChildren<{ href: string; className?: string }>): ReactElement {
    return (
        <AkselLink as={Link} href={href} className={className}>
            {children}
        </AkselLink>
    )
}

export function AkselNextLinkButton({
    children,
    title,
    href,
    ...rest
}: PropsWithChildren<ButtonProps> & { title: string; href: string }): ReactElement {
    return (
        <Tooltip content={title}>
            <Button {...rest} as={Link} href={href}>
                {children}
            </Button>
        </Tooltip>
    )
}
