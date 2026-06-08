import { Behandler } from './hpr-schema'

/** Standard lege with autorisasjon and one tilleggskompetanse (spesialist). */
export function createHprPersonMock(ident?: string): Behandler {
    return {
        godkjenninger: [
            {
                helsepersonellkategori: {
                    aktiv: true,
                    oid: 9060,
                    verdi: 'Lege',
                },
                autorisasjon: {
                    aktiv: true,
                    oid: 7704,
                    verdi: 'Autorisasjon',
                },
                tillegskompetanse: [
                    {
                        avsluttetStatus: null,
                        etag: 'etag-1',
                        gyldig: {
                            fra: '2024-01-01T00:00:00',
                            til: null,
                        },
                        id: 1,
                        type: {
                            aktiv: true,
                            oid: 1234,
                            verdi: 'Spesialist',
                        },
                    },
                ],
            },
        ],
        fnr: ident ?? '12345678901',
        hprNummer: 123456,
        fornavn: 'Ola',
        mellomnavn:
            'Nordmann NordmannNordmannNordmannNordmannNordmannNordmannNordmannNordmannNordmannNordmannNordmannNordmannNordmann',
        etternavn: 'Hansen',
    }
}

/** Kiropraktor with a licence that has expired (autorisasjon aktiv: false). No tilleggskompetanse. */
export function createHprKiropraktorMock(ident?: string): Behandler {
    return {
        godkjenninger: [
            {
                helsepersonellkategori: {
                    aktiv: true,
                    oid: 9060,
                    verdi: 'Kiropraktor',
                },
                autorisasjon: {
                    aktiv: false,
                    oid: 7704,
                    verdi: 'Autorisasjon',
                },
                tillegskompetanse: [],
            },
        ],
        fnr: ident ?? '23456789012',
        hprNummer: 234567,
        fornavn: 'Kari',
        mellomnavn: null,
        etternavn: 'Olsen',
    }
}

/** Fysioterapeut with multiple godkjenninger and a tilleggskompetanse with both fra and til set. */
export function createHprFysioterapeutMock(ident?: string): Behandler {
    return {
        godkjenninger: [
            {
                helsepersonellkategori: {
                    aktiv: true,
                    oid: 9060,
                    verdi: 'Fysioterapeut',
                },
                autorisasjon: {
                    aktiv: true,
                    oid: 7704,
                    verdi: 'Autorisasjon',
                },
                tillegskompetanse: [
                    {
                        avsluttetStatus: null,
                        etag: 'etag-2',
                        gyldig: {
                            fra: '2020-06-15T00:00:00',
                            til: '2025-06-15T00:00:00',
                        },
                        id: 2,
                        type: {
                            aktiv: true,
                            oid: 5678,
                            verdi: 'Manuellterapi',
                        },
                    },
                    {
                        avsluttetStatus: {
                            aktiv: false,
                            oid: 9999,
                            verdi: 'Avsluttet',
                        },
                        etag: 'etag-3',
                        gyldig: {
                            fra: '2018-01-01T00:00:00',
                            til: '2020-01-01T00:00:00',
                        },
                        id: 3,
                        type: {
                            aktiv: false,
                            oid: 4321,
                            verdi: 'Idrettsfysioterapi',
                        },
                    },
                ],
            },
            {
                helsepersonellkategori: {
                    aktiv: true,
                    oid: 9060,
                    verdi: 'Manuellterapeut',
                },
                autorisasjon: {
                    aktiv: true,
                    oid: 7704,
                    verdi: 'Autorisasjon',
                },
                tillegskompetanse: null,
            },
        ],
        fnr: ident ?? '34567890123',
        hprNummer: 345678,
        fornavn: 'Per',
        mellomnavn: 'Johan',
        etternavn: 'Berg',
    }
}

/** Behandler with no godkjenninger and all nullable fields set to null. */
export function createHprMinimalMock(ident?: string): Behandler {
    return {
        godkjenninger: [],
        fnr: ident ?? null,
        hprNummer: null,
        fornavn: null,
        mellomnavn: null,
        etternavn: null,
    }
}

/** Tannlege where helsepersonellkategori and autorisasjon are null (incomplete HPR record). */
export function createHprTannlegeMock(ident?: string): Behandler {
    return {
        godkjenninger: [
            {
                helsepersonellkategori: null,
                autorisasjon: null,
                tillegskompetanse: [
                    {
                        avsluttetStatus: null,
                        etag: null,
                        gyldig: null,
                        id: null,
                        type: null,
                    },
                ],
            },
        ],
        fnr: ident ?? '45678901234',
        hprNummer: 456789,
        fornavn: 'Anne',
        mellomnavn: null,
        etternavn: 'Dahl',
    }
}
