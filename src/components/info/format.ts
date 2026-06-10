import type { DiagnoseInfo, Navn } from '@services/apps/regulus-maximus/types'

export function navn(navn: Navn | null): string {
    if (navn == null) return 'Ukjent navn'

    return `${navn.fornavn} ${navn.mellomnavn ? navn.mellomnavn + ' ' : ''}${navn.etternavn}`
}

export function diagnose(diagnose: DiagnoseInfo | null): string {
    if (diagnose == null) return 'Ingen diagnose'

    return `${diagnose.tekst ?? 'Ingen diagnosetekst'} (${diagnose.system}:${diagnose.kode})`
}
