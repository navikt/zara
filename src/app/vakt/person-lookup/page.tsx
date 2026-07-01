import { Heading, Skeleton } from '@navikt/ds-react'
import React, { ReactElement, Suspense } from 'react'

import PersonSearchInfo from '#features/vakt/person-lookup/PersonSearchInfo'
import { produksjonsFeatures } from '#features/vakt/produksjons-feature-list'
import PersonLookupForm from '#features/vakt/shared/person-search/PersonLookupForm'
import VaktFeaturePage from '#features/vakt/shared/VaktFeaturePage'
import { decryptQueryParam } from '#lib/crypto/query-param-encryption'

async function Page({ searchParams }: PageProps<'/vakt/person-lookup'>): Promise<ReactElement> {
    const { ident } = await searchParams
    const plainIdent = typeof ident === 'string' ? decryptQueryParam(ident) : null

    return (
        <VaktFeaturePage feature={produksjonsFeatures.personLookup}>
            <PersonLookupForm
                label="Søk på fnr, dnr eller aktør-id"
                defaultIdent={plainIdent ?? undefined}
                path="/vakt/person-lookup"
            />
            {(plainIdent?.length ?? 0) > 3 && (
                <Suspense
                    fallback={
                        <div className="max-w-prose mt-4">
                            <Heading size="small" level="4">
                                Info om person
                            </Heading>
                            <Skeleton variant="rounded" width="100%" height={600} />
                        </div>
                    }
                >
                    <PersonSearchInfo ident={plainIdent as string} />
                </Suspense>
            )}
        </VaktFeaturePage>
    )
}

export default Page
