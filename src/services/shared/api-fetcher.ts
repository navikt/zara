import * as z from 'zod'
import { logger } from '@navikt/next-logger'
import { requestAzureClientCredentialsToken } from '@navikt/oasis'

import { bundledEnv } from '@lib/env'
import { failSpan, spanServerAsync } from '@lib/otel/server'

type ValidAPI = 'syfohelsenettproxy' | 'tsm-pdl-cache'

type ApiConfig = {
    namespace: string
}

const internalApis: Record<ValidAPI, ApiConfig> = {
    'tsm-pdl-cache': { namespace: 'tsm' },
    syfohelsenettproxy: { namespace: 'teamsykmelding' },
}

type ErrorTypes = 'TOKEN_EXCHANGE_FAILED' | 'API_CALL_FAILED' | 'API_BODY_INVALID'

export type ApiFetchErrors<AdditionalErrors extends string = never> = {
    errorType: ErrorTypes | AdditionalErrors
}

type FetchInternalAPIOptionsWithSchema<T extends z.ZodType, AdditionalErrors> = {
    api: keyof typeof internalApis
    path: `/${string}`
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD'
    headers?: HeadersInit
    body?: BodyInit
    responseSchema: T
    responseValidStatus?: number[]
    onApiError?: (response: Response) => AdditionalErrors | undefined
}

export async function fetchInternalAPI<
    Schema extends z.ZodType,
    AdditionalErrors extends string = never,
    InferredReturnValue = z.infer<Schema>,
>({
    api,
    path,
    headers,
    method,
    body,
    responseSchema,
    responseValidStatus = [],
    onApiError,
}: FetchInternalAPIOptionsWithSchema<Schema, AdditionalErrors>): Promise<
    InferredReturnValue | ApiFetchErrors<AdditionalErrors>
> {
    const pathWithoutIds = path.replace(/[a-f0-9\-]{36}/g, '<uuid>')

    return spanServerAsync(`InternalAPIs.${api}${pathWithoutIds}`, async (span) => {
        const apiConfig = await getApi(api)
        if ('errorType' in apiConfig) {
            return apiConfig
        }

        span.setAttributes({
            'InternalApi.server': apiConfig.host,
            'InternalApi.path': pathWithoutIds,
        })

        const response = await fetch(`http://${apiConfig.host}${path}`, {
            method,
            headers: {
                Authorization: `Bearer ${apiConfig.token}`,
                ...headers,
            },
            body,
        })

        if (!response.ok && !responseValidStatus?.includes(response.status)) {
            const additionalError: AdditionalErrors | undefined = onApiError?.(response)
            if (additionalError) {
                return { errorType: additionalError }
            }

            const responseBody = await getFailedResponseBody(response)
            failSpan(
                span,
                'API call failed',
                new Error(
                    `Unable to fetch ${path} (${response.status} ${response.statusText}), details: ${responseBody}`,
                ),
            )

            return { errorType: 'API_CALL_FAILED' }
        }

        const isJsonResponse: boolean = response.headers.get('Content-Type')?.includes('application/json') ?? false
        if (!isJsonResponse) {
            const error = new Error(
                `Did not get JSON payload (got: ${response.headers.get('Content-Type') ?? 'nothing'}) was provided for ${api}${path} (${method})`,
            )
            failSpan(span, 'Invalid Content-Type', error)
            throw error
        }

        const result: unknown = await response.json()
        const parsed = responseSchema.safeParse(result)

        if (!parsed.success) {
            logger.info(result)
            failSpan(
                span,
                'Invalid API response body',
                new Error(`Invalid response from ${path}`, { cause: parsed.error }),
            )

            return { errorType: 'API_BODY_INVALID' }
        }

        /**
         * TODO: Can this as be avoided?
         *
         * See: https://zod.dev/v4/changelog?id=updates-generics
         */
        return parsed.data as InferredReturnValue
    })
}

export async function getApi(
    api: ValidAPI,
): Promise<{ host: string; token: string } | { errorType: 'TOKEN_EXCHANGE_FAILED' }> {
    return spanServerAsync(`InternalAPIs.${api}.tokenExchange`, async (span) => {
        const apiConfig = internalApis[api]
        const cluster = bundledEnv.runtimeEnv === 'prod-gcp' ? 'prod-gcp' : 'dev-gcp'
        const target = `api://${cluster}.${apiConfig.namespace}.${api}/.default` as const

        span.setAttributes({
            'InternalApi.api': api,
            'InternalApi.cluster': cluster,
            'InternalApi.namespace': apiConfig.namespace,
            'InternalApi.identity_provider': 'azuread',
        })

        try {
            const tokenResult = await requestAzureClientCredentialsToken(target)
            if (!tokenResult.ok) {
                failSpan(span, 'Machine token exchange', tokenResult.error)

                return { errorType: 'TOKEN_EXCHANGE_FAILED' }
            }

            return { host: api, token: tokenResult.token }
        } catch (e) {
            failSpan(
                span,
                'Token exchange failed',
                new Error(`Unable to exchange client credentials token for ${target}`, {
                    cause: e,
                }),
            )

            return { errorType: 'TOKEN_EXCHANGE_FAILED' }
        }
    })
}

async function getFailedResponseBody(response: Response): Promise<string> {
    if (response.headers.get('Content-Type')?.includes('text/plain')) {
        return await response.text()
    } else if (response.headers.get('Content-Type')?.includes('application/json')) {
        return JSON.stringify(await response.json(), null, 2)
    } else {
        return 'No failed response body'
    }
}
