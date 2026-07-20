'use client'

import { ChevronRightIcon, HandBandageIcon, LaptopTriangleIcon } from '@navikt/aksel-icons'
import { Heading, LinkCard } from '@navikt/ds-react'
import { LinkCardAnchor, LinkCardDescription, LinkCardIcon, LinkCardTitle } from '@navikt/ds-react/LinkCard'
import Link from 'next/link'
import { useSelectedLayoutSegment } from 'next/navigation'
import React, { ReactElement } from 'react'

import { cn } from '#lib/tw'

import {
    technicalProduksjonsFeatureList,
    functionalProduksjonsFeatureList,
    VaktFeature,
} from './produksjons-feature-list'

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
                <Heading level="4" size="xsmall" className="flex items-center">
                    <HandBandageIcon aria-hidden className="-mb-0.5" />
                    Funksjonelle verktøy
                </Heading>
                {functionalProduksjonsFeatureList.map((item) => (
                    <FeatureMenuItem key={item.title} {...item} />
                ))}
                <Heading level="4" size="xsmall" className="flex items-center">
                    <LaptopTriangleIcon aria-hidden className="-mb-0.5" />
                    Tekniske verktøy
                </Heading>
                {technicalProduksjonsFeatureList.map((item) => (
                    <FeatureMenuItem key={item.title} {...item} />
                ))}
            </div>
        </div>
    )
}

function FeatureMenuItem({ Icon, href, description, title }: VaktFeature): ReactElement {
    const currentSegment = useSelectedLayoutSegment()
    const isActive = href.endsWith(currentSegment ?? '')

    return (
        <div key={href} className="relative">
            <LinkCard className={cn('overflow-hidden')} size="small">
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
            {isActive && (
                <div className="absolute -right-4 top-1/2 -translate-y-1/2 scale-y-500 text-ax-border-neutral bounce">
                    <ChevronRightIcon />
                </div>
            )}
        </div>
    )
}

export default VaktSidebar
