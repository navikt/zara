import React, { ReactElement, Suspense } from 'react'
import { Loader } from '@navikt/ds-react'

import { produksjonsFeatures } from '@features/vakt/produksjons-feature-list'
import VaktFeaturePage from '@features/vakt/shared/VaktFeaturePage'
import BehandlerLookupForm from '@features/behandler-lookup/BehandlerLookupForm'
import BehandlerSearchInfo from '@features/behandler-lookup/BehandlerSearchInfo'

async function Page({ searchParams }: PageProps<'/vakt/hpr-lookup'>): Promise<ReactElement> {
    const { hpr } = await searchParams

    return (
        <VaktFeaturePage feature={produksjonsFeatures.behandlerLookup}>
            <BehandlerLookupForm />
            {(hpr?.length ?? 0) > 3 && (
                <Suspense fallback={<Loader size="large" />}>
                    <BehandlerSearchInfo hpr={hpr as string} />
                </Suspense>
            )}
        </VaktFeaturePage>
    )
}

export default Page
