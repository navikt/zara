import * as z from 'zod'

export type Oppgave = z.infer<typeof OppgaveSchema>
export const OppgaveSchema = z.object({
    id: z.number(),
    versjon: z.number().optional(),
    tildeltEnhetsnr: z.string().optional(),
    opprettetAvEnhetsnr: z.string().optional(),
    aktoerId: z.string().optional(),
    journalpostId: z.string().optional(),
    behandlesAvApplikasjon: z.string().optional(),
    saksreferanse: z.string().optional(),
    tilordnetRessurs: z.string().optional(),
    beskrivelse: z.string().optional(),
    tema: z.string().optional(),
    oppgavetype: z.string(),
    behandlingstype: z.string().optional(),
    aktivDato: z.string(),
    fristFerdigstillelse: z.string().optional(),
    prioritet: z.string(),
    status: z.string().optional(),
    mappeId: z.number().optional(),
})
