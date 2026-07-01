import { EyeIcon, EyeClosedIcon } from '@navikt/aksel-icons'
import { BodyShort, Heading, Tooltip } from '@navikt/ds-react'
import React, { PropsWithChildren, ReactElement } from 'react'

import { produksjonsFeatures } from '#features/vakt/produksjons-feature-list'

type Props = {
    feature: (typeof produksjonsFeatures)[keyof typeof produksjonsFeatures]
}

function VaktFeaturePage({ feature, children }: PropsWithChildren<Props>): ReactElement {
    return (
        <div className="p-4">
            <Heading level="3" size="medium" className="flex items-center">
                <feature.Icon className="size-8 mr-2" aria-hidden />
                {feature.title}
                <div className="ml-2 pt-1">
                    {feature.auditlog ? (
                        <Tooltip content="Oppslag / endringer auditlogges">
                            <EyeIcon />
                        </Tooltip>
                    ) : (
                        <Tooltip content="Ingen auditlogging">
                            <EyeClosedIcon />
                        </Tooltip>
                    )}
                </div>
            </Heading>
            <BodyShort size="small" className="italic" spacing>
                {feature.description}
            </BodyShort>
            <div className="mt-4">{children}</div>
        </div>
    )
}

export default VaktFeaturePage
