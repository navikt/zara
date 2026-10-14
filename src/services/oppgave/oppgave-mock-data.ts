import { Oppgave } from './oppgave-schema'

export function createOppgaveMock(): Oppgave[] {
    return [
        {
            id: 1,
            versjon: 1,
            tildeltEnhetsnr: '1234',
            opprettetAvEnhetsnr: '1234',
            aktoerId: '1234567890123',
            journalpostId: 'JP123456',
            behandlesAvApplikasjon: 'APP',
            saksreferanse: 'SR123456',
            tilordnetRessurs: 'TR123456',
            beskrivelse: 'Beskrivelse av oppgaven',
            tema: 'Tema',
            oppgavetype: 'Oppgavetype',
            behandlingstype: 'Behandlingstype',
            aktivDato: '2024-06-01',
            fristFerdigstillelse: '2024-06-15',
            prioritet: 'Høy',
            status: 'Åpen',
            mappeId: 1,
        },
    ]
}

export function createMinimalOppgaveMock(): Oppgave[] {
    return [
        {
            id: 2,
            oppgavetype: 'Oppgavetype',
            aktivDato: '2024-06-01',
            prioritet: 'Høy',
            versjon: null,
            tildeltEnhetsnr: null,
            opprettetAvEnhetsnr: null,
            aktoerId: null,
            journalpostId: null,
            behandlesAvApplikasjon: null,
            saksreferanse: null,
            tilordnetRessurs: null,
            beskrivelse: null,
            tema: null,
            behandlingstype: null,
            fristFerdigstillelse: null,
            status: null,
            mappeId: null,
        },
    ]
}
