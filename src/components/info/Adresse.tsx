import React, { ReactElement } from 'react'

import { Adresse as AdresseType } from '@services/apps/regulus-maximus/types'

/**
 * Completely vibe coded component:
 */
export function Adresse({ adresse }: { adresse: AdresseType | null }): ReactElement | null {
    if (adresse == null) return <address className="italic">Ingen adresse</address>

    const street = adresse.gateadresse ?? adresse.postboks
    const postalLine =
        adresse.postnummer != null || adresse.poststed != null
            ? [adresse.postnummer, adresse.poststed].filter(Boolean).join(' ')
            : null
    const showLand = adresse.land != null && adresse.land !== 'NO'

    return (
        <address className="not-italic leading-snug">
            {street != null && <span className="block">{street}</span>}
            {postalLine != null && <span className="block">{postalLine}</span>}
            {adresse.kommune != null && postalLine == null && <span className="block">{adresse.kommune}</span>}
            {showLand && <span className="block">{adresse.land}</span>}
        </address>
    )
}
