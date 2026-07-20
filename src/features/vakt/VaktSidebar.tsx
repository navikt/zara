'use client'

import { HandBandageIcon, LaptopTriangleIcon } from '@navikt/aksel-icons'
import { Heading, LinkCard } from '@navikt/ds-react'
import { LinkCardAnchor, LinkCardDescription, LinkCardIcon, LinkCardTitle } from '@navikt/ds-react/LinkCard'
import { motion } from 'motion/react'
import Link from 'next/link'
import { useSelectedLayoutSegment } from 'next/navigation'
import React, { ReactElement, useCallback, useState } from 'react'

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
    const currentSegment = useSelectedLayoutSegment()
    // Box of the active item (top + height), relative to the list container.
    // Measured at commit via a ref callback on the active item, so it reflects
    // the real laid-out box - no stale render read, no layout effect.
    const [activeBox, setActiveBox] = useState<{ top: number; height: number } | null>(null)
    const measureActive = useCallback((node: HTMLDivElement | null) => {
        if (!node) return
        setActiveBox({ top: node.offsetTop, height: node.offsetHeight })
    }, [])

    return (
        <div className={cn(className, 'p-4 max-w-96 border-r-2 border-r-ax-border-meta-purple-subtle h-full')}>
            <Heading level="3" size="medium" spacing>
                Produksjonsvakt
            </Heading>
            <div className="relative flex flex-col gap-3">
                <Heading level="4" size="xsmall" className="flex items-center">
                    <HandBandageIcon aria-hidden className="-mb-0.5" />
                    Funksjonelle verktøy
                </Heading>
                {activeBox != null && (
                    <motion.div
                        aria-hidden
                        className="pointer-events-none absolute -right-0.5 w-1 rounded-full bg-ax-bg-meta-purple-moderate-pressed dark:bg-ax-bg-meta-purple-strong shadow-[0_0_8px_1px] shadow-ax-bg-meta-purple-strong dark:shadow-[0_0_10px_2px]"
                        initial={false}
                        animate={{ top: activeBox.top + 6, height: activeBox.height - 12 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                    />
                )}
                {functionalProduksjonsFeatureList.map((item) => (
                    <FeatureMenuItem
                        key={item.title}
                        currentSegment={currentSegment}
                        measureActive={measureActive}
                        {...item}
                    />
                ))}
                <Heading level="4" size="xsmall" className="flex items-center">
                    <LaptopTriangleIcon aria-hidden className="-mb-0.5" />
                    Tekniske verktøy
                </Heading>
                {technicalProduksjonsFeatureList.map((item) => (
                    <FeatureMenuItem
                        key={item.title}
                        currentSegment={currentSegment}
                        measureActive={measureActive}
                        {...item}
                    />
                ))}
            </div>
        </div>
    )
}

function FeatureMenuItem({
    Icon,
    href,
    description,
    title,
    currentSegment,
    measureActive,
}: VaktFeature & {
    currentSegment: string | null
    measureActive: (node: HTMLDivElement | null) => void
}): ReactElement {
    const isActive = href.endsWith(currentSegment ?? '')

    return (
        <div key={href} ref={isActive ? measureActive : undefined} className="relative">
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
        </div>
    )
}

export default VaktSidebar
