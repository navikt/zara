import React, { ReactElement } from 'react'

import PoisonPillSykmelding from '@features/landing-page/vakt/poison-pill/PoisonPillSykmelding'
import { produksjonsFeatures } from '@features/landing-page/vakt/produksjons-feature-list'
import VaktFeaturePage from '@features/landing-page/vakt/shared/VaktFeaturePage'

function Page(): ReactElement {
    return (
        <VaktFeaturePage feature={produksjonsFeatures.poisonPill}>
            <PoisonPillSykmelding />
        </VaktFeaturePage>
    )
}

export default Page
