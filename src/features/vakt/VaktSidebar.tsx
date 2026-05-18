import { Heading, LinkCard } from '@navikt/ds-react'
import React, { ReactElement } from 'react'
import Link from 'next/link'
import { LinkCardAnchor, LinkCardDescription, LinkCardIcon, LinkCardTitle } from '@navikt/ds-react/LinkCard'

import { cn } from '@lib/tw'

import { produksjonsFeatureList } from './produksjons-feature-list'

type Props = {
    className?: string
}

function VaktSidebar({ className }: Props): ReactElement {
    return (
        <div className={cn(className, 'p-4 max-w-96 border-r-2 border-r-ax-border-meta-purple-subtle h-full')}>
            <Heading level="3" size="medium" spacing>
                Produksjonsvakt
            </Heading>
            <div className="flex flex-col gap-3">
                {produksjonsFeatureList.map(({ Icon, href, description, title }) => (
                    <LinkCard key={href} className={cn('overflow-hidden')} size="small">
                        <LinkCardIcon>
                            <Icon fontSize="2rem" aria-hidden />
                        </LinkCardIcon>
                        <LinkCardTitle>
                            <LinkCardAnchor asChild>
                                <Link href={href}>{title}</Link>
                            </LinkCardAnchor>
                        </LinkCardTitle>
                        <LinkCardDescription>{description}</LinkCardDescription>
                    </LinkCard>
                ))}
            </div>
        </div>
    )
}

export default VaktSidebar
