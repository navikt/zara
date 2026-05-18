import { Behandler } from './hpr-schema'

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
