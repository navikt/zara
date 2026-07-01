import React, { ReactElement } from 'react'

import PoisonPillSykmelding from '#features/vakt/poison-pill/PoisonPillSykmelding'
import { produksjonsFeatures } from '#features/vakt/produksjons-feature-list'
import VaktFeaturePage from '#features/vakt/shared/VaktFeaturePage'

function Page(): ReactElement {
    return (
        <VaktFeaturePage feature={produksjonsFeatures.poisonPill}>
            <PoisonPillSykmelding />
        </VaktFeaturePage>
    )
}

export default Page
