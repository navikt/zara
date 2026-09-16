const ASSESSMENT_LIST_ID = '610d4e68-f458-40c6-b679-aa252d0e37ad'

export type GraphItem = { id?: unknown; fields?: Record<string, unknown> }
type GraphPage = { value?: GraphItem[]; '@odata.nextLink'?: string }

export const GRAPH_ORIGIN = 'https://graph.microsoft.com'
export const SITE_ID = 'navno.sharepoint.com,95301137-e2e2-4562-9235-12be7e724dca,70b97532-3800-410f-bb8c-11b1637c40eb'

export async function graphError(response: Response, token: string): Promise<Error> {
    const body = (await response.json().catch(() => null)) as { error?: { code?: string; message?: string } } | null
    const details = [body?.error?.code, body?.error?.message]
        .filter((value): value is string => typeof value === 'string')
        .join(': ')
        .replaceAll(token, '[REDACTED]')
    const requestId = response.headers.get('request-id')
    const claimsChallenge = response.headers.get('www-authenticate')?.includes('insufficient_claims')
    return new Error(
        [
            `Graph request failed: ${response.status} ${response.statusText}`,
            details,
            requestId ? `Request ID: ${requestId}` : '',
            claimsChallenge
                ? 'Entra requires additional claims; a copied bearer token may not satisfy the access policy.'
                : '',
        ]
            .filter(Boolean)
            .join('\n'),
    )
}

export async function fetchGraphPages(url: URL, token: string, init?: RequestInit): Promise<GraphItem[]> {
    const items: GraphItem[] = []
    let nextUrl: string | undefined = url.href
    while (nextUrl) {
        if (new URL(nextUrl).origin !== GRAPH_ORIGIN) {
            throw new Error('Refusing to send the token to a non-Graph URL.')
        }
        const response = await fetch(nextUrl, {
            ...init,
            headers: { Authorization: `Bearer ${token}`, ...init?.headers },
            redirect: 'error',
            signal: AbortSignal.timeout(60_000),
        })
        if (!response.ok) throw await graphError(response, token)
        const page = (await response.json()) as GraphPage
        if (!Array.isArray(page.value)) throw new Error('Graph response has no item array.')
        items.push(...page.value)
        nextUrl = page['@odata.nextLink']
    }
    return items
}

export async function fetchAssessments(token: string): Promise<GraphItem[]> {
    const url = new URL(`${GRAPH_ORIGIN}/v1.0/sites/${SITE_ID}/lists/${ASSESSMENT_LIST_ID}/items`)
    url.searchParams.set('$select', 'id')
    url.searchParams.set('$expand', 'fields')
    url.searchParams.set('$filter', 'fields/TeamUnikID eq 1344582922')

    return fetchGraphPages(url, token, {
        headers: {
            // TeamUnikID is not indexed; SharePoint may still reject large queries.
            Prefer: 'HonorNonIndexedQueriesWarningMayFailRandomly',
        },
    })
}
