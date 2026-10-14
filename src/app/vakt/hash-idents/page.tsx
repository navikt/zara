import React, { ReactElement } from 'react'

import HashIdentsForm from '#features/vakt/hash-idents/HashIdentsForm'
import { produksjonsFeatures } from '#features/vakt/produksjons-feature-list'
import VaktFeaturePage from '#features/vakt/shared/VaktFeaturePage'

function Page(): ReactElement {
    return (
        <VaktFeaturePage feature={produksjonsFeatures.technical.hashIdents}>
            <HashIdentsForm />
        </VaktFeaturePage>
    )
}

export default Page
