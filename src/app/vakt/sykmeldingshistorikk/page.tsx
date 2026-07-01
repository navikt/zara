import { Skeleton } from '@navikt/ds-react'
import React, { ReactElement, Suspense } from 'react'

import { produksjonsFeatures } from '#features/vakt/produksjons-feature-list'
import PersonLookupForm from '#features/vakt/shared/person-search/PersonLookupForm'
import VaktFeaturePage from '#features/vakt/shared/VaktFeaturePage'
import RangePicker, { ValidTimelineRanges } from '#features/vakt/sykmeldingshistorikk/RangePicker'
import Sykmeldingshistorikk from '#features/vakt/sykmeldingshistorikk/Sykmeldingshistorikk'
import { decryptQueryParam } from '#lib/crypto/query-param-encryption'

async function Page({ searchParams }: PageProps<'/vakt/sykmeldingshistorikk'>): Promise<ReactElement> {
    const { ident, range } = await searchParams
    const plainIdent = typeof ident === 'string' ? decryptQueryParam(ident) : null
    const selectedRange = (typeof range === 'string' ? range : 'LAST_1_YEARS') as ValidTimelineRanges

    return (
        <VaktFeaturePage feature={produksjonsFeatures.sykmeldingshistorikk}>
            <PersonLookupForm
                label="Søk på ident (fnr eller dnr)"
                defaultIdent={plainIdent ?? undefined}
                path="/vakt/sykmeldingshistorikk"
            >
                <RangePicker />
            </PersonLookupForm>
            {(plainIdent?.length ?? 0) > 3 && (
                <Suspense
                    fallback={
                        <div className="mt-4">
                            <Skeleton variant="rounded" width="100%" height={300} />
                        </div>
                    }
                >
                    <Sykmeldingshistorikk ident={plainIdent as string} range={selectedRange} />
                </Suspense>
            )}
        </VaktFeaturePage>
    )
}

export default Page
