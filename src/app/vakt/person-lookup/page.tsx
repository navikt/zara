import React, { ReactElement, Suspense } from 'react'
import { Heading, Skeleton } from '@navikt/ds-react'

import { produksjonsFeatures } from '@features/vakt/produksjons-feature-list'
import VaktFeaturePage from '@features/vakt/shared/VaktFeaturePage'
import PersonSearchInfo from '@features/person-lookup/PersonSearchInfo'
import PersonLookupForm from '@features/person-lookup/PersonLookupForm'
import { decryptQueryParam } from '@lib/crypto/query-param-encryption'

async function Page({ searchParams }: PageProps<'/vakt/person-lookup'>): Promise<ReactElement> {
    const { ident } = await searchParams
    const plainIdent = typeof ident === 'string' ? decryptQueryParam(ident) : null

    return (
        <VaktFeaturePage feature={produksjonsFeatures.personLookup}>
            <PersonLookupForm defaultIdent={plainIdent ?? undefined} />
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
