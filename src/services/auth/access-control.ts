import * as R from 'remeda'
import { logger } from '@navikt/next-logger'

import { userInfo } from '@services/auth/auth'
import { bundledEnv } from '@lib/env'

const GroupToFeatureMap: Record<string, ZaraFeatures> = {
    '74d71639-b6e1-487b-86e4-ca902a433f7c': 'TEAM_MEMBER',
    '95f6101c-0cd4-4d4a-9435-6b1a7775782c': 'TILBAKEMELDINGER',
    '8510a25e-2c26-4088-a8ff-a4a2a9de3d21': 'BRUKSVILKÅR',
    '35c70ac7-e8e6-4cec-933b-86106a97c0d4': 'UTVIKLER',
}

export type ZaraFeatures = 'TEAM_MEMBER' | 'TILBAKEMELDINGER' | 'BRUKSVILKÅR' | 'UTVIKLER'

export async function userHasAccess(features: 'ANY' | ZaraFeatures | ZaraFeatures[]): Promise<boolean> {
    const featureAccess = await userFeatures()

    if (features === 'ANY') {
        if (featureAccess.length === 0) logger.error('User without ANY EntraAD groups? Mega-sus. >:(')

        return featureAccess.length > 0
    }

    if (typeof features === 'string') {
        return featureAccess.includes(features)
    }

    return features.every((feature) => featureAccess.includes(feature))
}

export async function userFeatures(): Promise<ZaraFeatures[]> {
    // dev-gcp has allowAllUsers: true, let pretend user has all access
    if (bundledEnv.runtimeEnv === 'dev-gcp') return R.values(GroupToFeatureMap)

    const info = await userInfo()
    if (info == null) return []

    return info.groups.map((group): ZaraFeatures | null => GroupToFeatureMap[group]).filter(R.isNonNullish)
}
