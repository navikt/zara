import { logger } from '@navikt/next-logger'
import { requestAzureClientCredentialsToken } from '@navikt/oasis'

import { bundledEnv } from '@lib/env'
import { validateUserSession } from '@services/auth/auth'

import { devAvatarBase64 } from '../../../../dev/dev-image'

/**
 * Proxies any user's (using UPN) profile picture using a authenticated request to the MS Graph API.
 */
export async function GET(_: Request, { params }: RouteContext<'/api/avatar/[upn]'>): Promise<Response> {
    const { upn } = await params

    /**
     * Only allow authenticated users to proxy avatars.
     */
    await validateUserSession()

    /**
     * Return a fixed avatar for dev user, 404 for fake "other" users.
     */
    if (bundledEnv.runtimeEnv === 'local') {
        return handleLocalDevelopmentRequest(upn)
    }

    try {
        const clientCredentials = await requestAzureClientCredentialsToken('https://graph.microsoft.com/.default')
        if (!clientCredentials.ok) {
            logger.error(
                new Error(`Unable to acquire Azure client credentials token: ${clientCredentials.error.message}`, {
                    cause: clientCredentials.error,
                }),
            )
            return new Response(undefined, { status: 404 })
        }

        const avatarResponse = await fetch(`https://graph.microsoft.com/v1.0/users/${upn}/photo/64x64/$value`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${clientCredentials.token}` },
        })

        /**
         * Mask any MS Graph API errors as 404
         */
        if (!avatarResponse.ok) {
            const contentType = avatarResponse.headers.get('Content-Type')
            logger.warn(
                new Error(`Unable to fetch user photo from MS Graph: ${avatarResponse.statusText}`, {
                    cause: contentType != null ? new Error(await avatarResponse.text()) : undefined,
                }),
            )
            return new Response(undefined, { status: 404 })
        }

        /**
         * We got avatar, we can return it to the browser directly without touching the body.
         */
        return avatarResponse
    } catch (error) {
        logger.error(new Error('Unknown error while trying to fetch token from MS Graph API', { cause: error }))
        return new Response(undefined, { status: 404 })
    }
}

function handleLocalDevelopmentRequest(upn: string): Response {
    if (upn === 'fake-dev-oid') {
        return new Response(Buffer.from(devAvatarBase64, 'base64'), {
            headers: { 'Content-Type': 'image/jpeg' },
        })
    } else {
        return new Response(undefined, { status: 404 })
    }
}
