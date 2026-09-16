import {
    fetchGraphPages,
    GRAPH_ORIGIN,
    type GraphItem,
    SITE_ID,
} from '#services/ros/msgraph-tryggnok/fetch-assessments'

const TILTAK_LIST_ID = 'be87771f-a7b7-4618-95c9-45efdcab8eaf'

export type TiltakEntry = { assessmentId: number; title?: unknown; tiltakCount: number; tiltak: GraphItem[] }

async function fetchTiltakRows(rvId: number, token: string): Promise<GraphItem[]> {
    const url = new URL(`${GRAPH_ORIGIN}/v1.0/sites/${SITE_ID}/lists/${TILTAK_LIST_ID}/items`)
    url.searchParams.set('$expand', 'fields')
    // RV_ID is indexed, so no Prefer header is required.
    url.searchParams.set('$filter', `fields/RV_ID eq ${rvId}`)
    return fetchGraphPages(url, token)
}

export async function fetchTiltak(assessments: GraphItem[], token: string): Promise<TiltakEntry[]> {
    const results: TiltakEntry[] = []
    for (const assessment of assessments) {
        const rvId = Number(assessment.id)
        if (!Number.isInteger(rvId)) continue
        const tiltak = await fetchTiltakRows(rvId, token)
        results.push({
            assessmentId: rvId,
            title: assessment.fields?.RV_Tittel ?? assessment.fields?.Title,
            tiltakCount: tiltak.length,
            tiltak,
        })
    }
    return results
}
