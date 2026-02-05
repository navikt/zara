import { getMsOboToken } from '@services/entra/ms-graph'
import { bundledEnv } from '@lib/env'

import { devAvatarBase64 } from '../../../../dev/dev-image'

/**
 * Proxies any user's (using UPN) profile picture using a authenticated request to the MS Graph API.
 */
export async function GET(_: Request, { params }: RouteContext<'/api/avatar/[upn]'>): Promise<Response> {
    if (bundledEnv.runtimeEnv === 'local') {
        return new Response(Buffer.from(devAvatarBase64, 'base64'), {
            headers: { 'Content-Type': 'image/jpeg' },
        })
    }

    const obo = await getMsOboToken()
    const { upn } = await params

    return fetch(`https://graph.microsoft.com/v1.0/users/${upn}/photo/$value`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${obo}` },
    })
}
