'use client'

import React, { ReactElement } from 'react'
import { Heading, LinkCard } from '@navikt/ds-react'
import { BandageIcon, GavelSoundBlockIcon, NotePencilDashIcon } from '@navikt/aksel-icons'
import Link from 'next/link'
import { PageBlock } from '@navikt/ds-react/Page'

function Page(): ReactElement {
    return (
        <PageBlock as="main" width="2xl" gutters>
            <Heading level="2" size="large" spacing>
                Hva vil du gjøre i dag?
            </Heading>
            <div className="bg-ax-bg-raised p-4 rounded-md w-full">
                <Heading level="3" size="large" spacing className="flex items-center gap-3">
                    <BandageIcon aria-hidden className="-mb-0.5" />
                    syk-inn
                </Heading>
                <div className="grid grid-cols-3 gap-4">
                    <LinkCard className="max-w-prose">
                        <LinkCard.Icon>
                            <NotePencilDashIcon fontSize="2rem" aria-hidden />
                        </LinkCard.Icon>
                        <LinkCard.Title>
                            <LinkCard.Anchor asChild>
                                <Link href="/syk-inn/tilbakemeldinger">Tilbakemeldinger</Link>
                            </LinkCard.Anchor>
                        </LinkCard.Title>
                        <LinkCard.Description>
                            Oversikt over tilbakemeldinger fra brukere i syk-inn-applikasjonen.
                        </LinkCard.Description>
                    </LinkCard>
                    <LinkCard className="max-w-prose">
                        <LinkCard.Icon>
                            <GavelSoundBlockIcon fontSize="2rem" aria-hidden />
                        </LinkCard.Icon>
                        <LinkCard.Title>
                            <LinkCard.Anchor asChild>
                                <Link href="/syk-inn/bruksvilkar">Bruksvilkår</Link>
                            </LinkCard.Anchor>
                        </LinkCard.Title>
                        <LinkCard.Description>
                            Administrer og oppdater bruksvilkårene for syk-inn-applikasjonen.
                        </LinkCard.Description>
                    </LinkCard>
                </div>
            </div>
        </PageBlock>
    )
}

export default Page
