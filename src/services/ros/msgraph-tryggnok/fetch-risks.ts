import {
    fetchGraphPages,
    GRAPH_ORIGIN,
    type GraphItem,
    SITE_ID,
} from '#services/ros/msgraph-tryggnok/fetch-assessments'

const RISK_LIST_ID = '21a2f938-1a63-447f-a317-d438a6d17a8c'

export type RisksEntry = { assessmentId: number; title?: unknown; riskCount: number; risks: GraphItem[] }

async function fetchRiskRows(rnr: number, token: string): Promise<GraphItem[]> {
    const url = new URL(`${GRAPH_ORIGIN}/v1.0/sites/${SITE_ID}/lists/${RISK_LIST_ID}/items`)
    url.searchParams.set('$expand', 'fields')
    // Rnr is indexed, so no Prefer header is required.
    url.searchParams.set('$filter', `fields/Rnr eq ${rnr}`)
    return fetchGraphPages(url, token)
}

export async function fetchRisks(assessments: GraphItem[], token: string): Promise<RisksEntry[]> {
    const results: RisksEntry[] = []
    for (const assessment of assessments) {
        const rnr = Number(assessment.id)
        if (!Number.isInteger(rnr)) continue
        const risks = await fetchRiskRows(rnr, token)
        results.push({
            assessmentId: rnr,
            title: assessment.fields?.RV_Tittel ?? assessment.fields?.Title,
            riskCount: risks.length,
            risks,
        })
    }
    return results
}
