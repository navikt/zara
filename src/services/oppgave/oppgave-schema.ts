import * as z from 'zod'

export type Oppgave = z.infer<typeof OppgaveSchema>
export const OppgaveSchema = z.object({
    id: z.number(),
    versjon: z.number().nullable(),
    tildeltEnhetsnr: z.string().nullable(),
    opprettetAvEnhetsnr: z.string().nullable(),
    aktoerId: z.string().nullable(),
    journalpostId: z.string().nullable(),
    behandlesAvApplikasjon: z.string().nullable(),
    saksreferanse: z.string().nullable(),
    tilordnetRessurs: z.string().nullable(),
    beskrivelse: z.string().nullable(),
    tema: z.string().nullable(),
    oppgavetype: z.string(),
    behandlingstype: z.string().nullable(),
    aktivDato: z.string(),
    fristFerdigstillelse: z.string().nullable(),
    prioritet: z.string(),
    status: z.string().nullable(),
    mappeId: z.number().nullable(),
})
