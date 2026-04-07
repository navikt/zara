'use client'

import React, { ReactElement } from 'react'
import { Heading, LinkCard } from '@navikt/ds-react'
import {
    BandageIcon,
    Buildings3Icon,
    GavelSoundBlockIcon,
    NotePencilDashIcon,
    PadlockLockedIcon,
    SandboxIcon,
} from '@navikt/aksel-icons'
import Link from 'next/link'

import { type ZaraFeatures } from '@services/auth/access-control'
import { bundledEnv } from '@lib/env'
import { cn } from '@lib/tw'

type Props = {
    features: ZaraFeatures[]
}

function LandingPage({ features }: Props): ReactElement {
    return (
        <div className="flex flex-col gap-6">
            <div className="bg-ax-bg-raised p-4 rounded-md w-full">
                <Heading level="3" size="large" spacing className="flex items-center gap-3">
                    <BandageIcon aria-hidden className="-mb-0.5" />
                    syk-inn
                </Heading>
                <div className="gap-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    <AccessibleFeature
                        Icon={NotePencilDashIcon}
                        title="Tilbakemeldinger"
                        description="Oversikt over tilbakemeldinger fra brukere i syk-inn-applikasjonen."
                        href="/syk-inn/tilbakemeldinger"
                        hasAccess={features.includes('TILBAKEMELDINGER')}
                    />
                    <AccessibleFeature
                        Icon={GavelSoundBlockIcon}
                        title="Bruksvilkår"
                        description="Se hvilke pilotbrukere som har signert bruksvilkår."
                        href="/syk-inn/bruksvilkar"
                        hasAccess={features.includes('BRUKSVILKÅR')}
                    />
                    {bundledEnv.runtimeEnv !== 'prod-gcp' && (
                        <AccessibleFeature
                            Icon={SandboxIcon}
                            title="Systemjobber (utviklere)"
                            description="Se og kontroller bakgrunnsjobber i syk-inn-applikasjonen."
                            href="/syk-inn/admin"
                            hasAccess={features.includes('UTVIKLER')}
                        />
                    )}
                </div>
            </div>
            <div className="bg-ax-bg-raised p-4 rounded-md w-full">
                <Heading level="3" size="large" spacing className="flex items-center gap-3">
                    <BandageIcon aria-hidden className="-mb-0.5" />
                    Team
                </Heading>
                <div className="gap-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    <AccessibleFeature
                        Icon={Buildings3Icon}
                        title="Kontordager"
                        href="/team/kontor"
                        description="Styr dine kontordager og om du er remote- eller kontoransatt"
                        hasAccess={features.includes('TEAM_MEMBER')}
                    />
                </div>
            </div>
        </div>
    )
}

function AccessibleFeature({
    Icon,
    title,
    description,
    href,
    hasAccess,
}: {
    Icon: typeof NotePencilDashIcon
    title: string
    description: string
    href: string
    hasAccess: boolean
}): ReactElement {
    return (
        <LinkCard
            className={cn('overflow-hidden', {
                'pointer-events-none': !hasAccess,
            })}
        >
            {!hasAccess && (
                <div className="w-full scale-120 bg-ax-neutral-300/70 dark:bg-ax-neutral-400/70 absolute -rotate-12 items-center justify-center py-2 z-50 flex gap-2">
                    <PadlockLockedIcon className="text-2xl" aria-hidden />
                    Ingen tilgang
                </div>
            )}

            <LinkCard.Icon>
                <Icon fontSize="2rem" aria-hidden />
            </LinkCard.Icon>
            <LinkCard.Title>
                {hasAccess ? (
                    <LinkCard.Anchor asChild>
                        <Link href={href}>{title}</Link>
                    </LinkCard.Anchor>
                ) : (
                    title
                )}
            </LinkCard.Title>
            <LinkCard.Description>{description}</LinkCard.Description>
        </LinkCard>
    )
}

export default LandingPage
