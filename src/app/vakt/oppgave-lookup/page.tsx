import { Heading, Skeleton } from '@navikt/ds-react'
import React, { ReactElement, Suspense } from 'react'

import OppgaveLookupForm from '#features/vakt/oppgave-lookup/OppgaveLookupForm'
import OppgaveSearchInfo from '#features/vakt/oppgave-lookup/OppgaveSearchInfo'
import { produksjonsFeatures } from '#features/vakt/produksjons-feature-list'
import VaktFeaturePage from '#features/vakt/shared/VaktFeaturePage'

async function Page({ searchParams }: PageProps<'/vakt/oppgave-lookup'>): Promise<ReactElement> {
    const { ident } = await searchParams

    return (
        <VaktFeaturePage feature={produksjonsFeatures.functional.oppgaveLookup}>
            <OppgaveLookupForm />
            {(ident?.length ?? 0) > 3 && (
                <Suspense
                    fallback={
                        <div className="max-w-prose mt-4">
                            <Heading size="small" level="4">
                                Informasjon om oppgave
                            </Heading>
                            <Skeleton variant="rounded" width="100%" height={600} />
                        </div>
                    }
                >
                    <OppgaveSearchInfo ident={ident as string} />
                </Suspense>
            )}
        </VaktFeaturePage>
    )
}

export default Page
