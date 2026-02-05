import { logger } from '@navikt/next-logger'
import { requestAzureClientCredentialsToken } from '@navikt/oasis'

import { bundledEnv } from '@lib/env'

import { devAvatarBase64 } from '../../../../dev/dev-image'

/**
 * Proxies any user's (using UPN) profile picture using a authenticated request to the MS Graph API.
 */
export async function GET(_: Request, { params }: RouteContext<'/api/avatar/[upn]'>): Promise<Response> {
    const { upn } = await params

    if (bundledEnv.runtimeEnv === 'local') {
        if (upn === 'fake-dev-oid') {
            return new Response(Buffer.from(devAvatarBase64, 'base64'), {
                headers: { 'Content-Type': 'image/jpeg' },
            })
        } else {
            return new Response(undefined, { status: 404 })
        }
    }

    try {
        const response = await requestAzureClientCredentialsToken('https://graph.microsoft.com/.default')
        if (!response.ok) {
            logger.error(
                new Error(`Unable to acquire Azure client credentials token: ${response.error.message}`, {
                    cause: response.error,
                }),
            )
            return new Response(undefined, { status: 404 })
        }

        return fetch(`https://graph.microsoft.com/v1.0/users/${upn}/photo/$value`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${response.token}` },
        }).then(async (res) => {
            if (!res.ok) {
                const contentType = res.headers.get('Content-Type')
                logger.warn(
                    new Error(`Unable to fetch user photo from MS Graph: ${res.statusText}`, {
                        cause: contentType != null ? new Error(await res.text()) : undefined,
                    }),
                )
                return new Response(undefined, { status: 404 })
            }

            return res
        })
    } catch (e) {
        logger.error(e)
        return new Response(undefined, { status: 404 })
    }
}
