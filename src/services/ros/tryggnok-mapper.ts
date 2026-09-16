import type { RisksEntry } from '#services/ros/msgraph-tryggnok/fetch-risks'
import type { TiltakEntry } from '#services/ros/msgraph-tryggnok/fetch-tiltak'

export type TiltakStatus = 'Mulig tiltak' | 'Skal gjennomføres' | 'Implementert' | 'Besluttet å ikke gjennomføre'

// Attributter list (ee03ba07-...) item IDs -> human-readable status.
const TILTAK_STATUS: Record<number, TiltakStatus> = {
    123: 'Mulig tiltak',
    124: 'Skal gjennomføres',
    125: 'Implementert',
    138: 'Besluttet å ikke gjennomføre',
}

export type Sannsynlighet = 'Meget lite sannsynlig' | 'Lite sannsynlig' | 'Moderat' | 'Sannsynlig' | 'Meget sannsynlig'

export type Konsekvens = 'Ubetydelig' | 'Lav' | 'Moderat' | 'Alvorlig' | 'Svært alvorlig'

// Stored value is 0-based (0-4) -> displayed level 1-5.
const SANNSYNLIGHET: Sannsynlighet[] = [
    'Meget lite sannsynlig',
    'Lite sannsynlig',
    'Moderat',
    'Sannsynlig',
    'Meget sannsynlig',
]

const KONSEKVENS: Konsekvens[] = ['Ubetydelig', 'Lav', 'Moderat', 'Alvorlig', 'Svært alvorlig']

export type TiltakNode = {
    title: unknown
    status: TiltakStatus | null
    sistEndret: string | null
}

export type RiskNode = {
    id: string
    title: unknown
    sannsynlighet: { level: number; label: Sannsynlighet } | null
    konsekvens: { level: number; label: Konsekvens } | null
    kommentar: string | null
    opprettet: string | null
    sistEndret: string | null
    tags: RiskTags
    tiltak: TiltakNode[]
}

export type RiskTags = {
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
    opprettet: string | null
    sistEndret: string | null
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

// Normalises a TryggNok/Graph date field to an ISO string, or null when absent/invalid.
function date(value: unknown): string | null {
    if (typeof value !== 'string' || !value.trim()) return null
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
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
                sistEndret: date(t.fields?.Modified),
            }
            const bucket = tiltakByRiskUnikId.get(riskUnikId)
            if (bucket) bucket.push(node)
            else tiltakByRiskUnikId.set(riskUnikId, [node])
        }
    }

    return risksData.map((entry) => ({
        assessmentId: entry.assessmentId,
        title: entry.title,
        opprettet: date(entry.opprettet),
        sistEndret: date(entry.sistEndret),
        risks: entry.risks
            // Deleted risks and auto-generated questionnaire scenarios (qa_Type === 2)
            // are not shown in the real app, so they are filtered out.
            .filter((r) => !r.fields?.Slettet && num(r.fields?.qa_Type) !== 2)
            .map((r) => {
                const unikId = num(r.fields?.UnikID)
                return {
                    id: String(r.id),
                    title: r.fields?.Title,
                    sannsynlighet: scaleLevel(r.fields?.NySannsynlighet, SANNSYNLIGHET),
                    konsekvens: scaleLevel(r.fields?.NyKonsekvens, KONSEKVENS),
                    kommentar: text(r.fields?.Kommentar),
                    opprettet: date(r.fields?.Opprettet_TryggNokSkriv ?? r.fields?.Created),
                    sistEndret: date(r.fields?.Endret_TryggNokSkriv ?? r.fields?.Modified),
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
