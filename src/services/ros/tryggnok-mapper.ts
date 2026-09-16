import type { RisksEntry } from '#services/ros/msgraph-tryggnok/fetch-risks'
import type { TiltakEntry } from '#services/ros/msgraph-tryggnok/fetch-tiltak'

type TiltakStatus = 'Mulig tiltak' | 'Skal gjennomføres' | 'Implementert' | 'Besluttet å ikke gjennomføre'

// Attributter list (ee03ba07-...) item IDs -> human-readable status.
const TILTAK_STATUS: Record<number, TiltakStatus> = {
    123: 'Mulig tiltak',
    124: 'Skal gjennomføres',
    125: 'Implementert',
    138: 'Besluttet å ikke gjennomføre',
}

type Sannsynlighet = 'Meget lite sannsynlig' | 'Lite sannsynlig' | 'Moderat' | 'Sannsynlig' | 'Meget sannsynlig'

type Konsekvens = 'Ubetydelig' | 'Lav' | 'Moderat' | 'Alvorlig' | 'Svært alvorlig'

// Stored value is 0-based (0-4) -> displayed level 1-5.
const SANNSYNLIGHET: Sannsynlighet[] = [
    'Meget lite sannsynlig',
    'Lite sannsynlig',
    'Moderat',
    'Sannsynlig',
    'Meget sannsynlig',
]

const KONSEKVENS: Konsekvens[] = ['Ubetydelig', 'Lav', 'Moderat', 'Alvorlig', 'Svært alvorlig']

type TiltakNode = {
    title: unknown
    status: TiltakStatus | null
}

type RiskNode = {
    id: string
    title: unknown
    sannsynlighet: { level: number; label: Sannsynlighet } | null
    konsekvens: { level: number; label: Konsekvens } | null
    kommentar: string | null
    tags: RiskTags
    tiltak: TiltakNode[]
}

type RiskTags = {
    mulighet: boolean
    adressebeskyttelse: boolean
    konfidensialitet: boolean
    egenAnsatt: boolean
    integritet: boolean
    personvern: boolean
    viktigFunn: boolean
    ikkeRelevant: boolean
    tilgjengelighet: boolean
}

export type RosNode = {
    assessmentId: number
    title: unknown
    risks: RiskNode[]
}

function num(value: unknown): number | null {
    const n = Number(value)
    return Number.isFinite(n) ? n : null
}

function text(value: unknown): string | null {
    return typeof value === 'string' && value.trim() ? value.trim() : null
}

function bool(value: unknown): boolean {
    return value === true || value === 1 || value === '1'
}

function scaleLevel<T>(value: unknown, labels: T[]): { level: number; label: T } | null {
    const raw = num(value)
    if (raw === null) return null
    const label = labels[raw]
    return label !== undefined ? { level: raw + 1, label } : null
}

export function buildTryggnokTree(risksData: RisksEntry[], tiltakData: TiltakEntry[]): RosNode[] {
    // Group tiltak by the risk they belong to: Tiltak.RisikoUnikID -> Risk.UnikID
    const tiltakByRiskUnikId = new Map<number, TiltakNode[]>()
    for (const entry of tiltakData) {
        for (const t of entry.tiltak) {
            if (t.fields?.Slettet) continue // deleted tiltak are filtered out
            const riskUnikId = num(t.fields?.RisikoUnikID)
            if (riskUnikId === null) continue
            const statusKey = num(t.fields?.StatusIDvalue)
            const node: TiltakNode = {
                title: t.fields?.Tiltak_Tittel ?? t.fields?.Title,
                status: statusKey !== null ? (TILTAK_STATUS[statusKey] ?? null) : null,
            }
            const bucket = tiltakByRiskUnikId.get(riskUnikId)
            if (bucket) bucket.push(node)
            else tiltakByRiskUnikId.set(riskUnikId, [node])
        }
    }

    return risksData.map((entry) => ({
        assessmentId: entry.assessmentId,
        title: entry.title,
        risks: entry.risks
            .filter((r) => !r.fields?.Slettet) // deleted risks are filtered out
            .map((r) => {
                const unikId = num(r.fields?.UnikID)
                return {
                    id: String(r.id),
                    title: r.fields?.Title,
                    sannsynlighet: scaleLevel(r.fields?.NySannsynlighet, SANNSYNLIGHET),
                    konsekvens: scaleLevel(r.fields?.NyKonsekvens, KONSEKVENS),
                    kommentar: text(r.fields?.Kommentar),
                    tags: {
                        mulighet: bool(r.fields?.Mulighet),
                        adressebeskyttelse: bool(r.fields?.tag_Kode67),
                        konfidensialitet: bool(r.fields?.tag_Konfidensialitet),
                        egenAnsatt: bool(r.fields?.tag_EgenAnsatt),
                        integritet: bool(r.fields?.tag_Integritet),
                        personvern: bool(r.fields?.Personvern),
                        viktigFunn: num(r.fields?.Kritisk) === 3,
                        ikkeRelevant: bool(r.fields?.IkkeRelevant),
                        tilgjengelighet: bool(r.fields?.tag_Tilgjengelighet),
                    },
                    tiltak: unikId !== null ? (tiltakByRiskUnikId.get(unikId) ?? []) : [],
                }
            }),
    }))
}
