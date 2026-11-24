import { Behandler } from './hpr-schema'

export function createHprPersonMock(hpr: string): Behandler {
    return {
        hpr,
        ident: '12345678901',
        navn: { fornavn: 'Ola', etternavn: 'Hansen' },
        godkjenning: [
            {
                autorisasjon: { oid: 7704, verdi: 'Autorisasjon' },
                helsepersonellkategori: { oid: 9060, verdi: 'Lege' },
                tilleggskompetanse: [
                    {
                        avsluttetStatus: { oid: 1234, verdi: 'Spesialist' },
                        gyldig: { fra: '2024-01-01' },
                        type: { oid: 1234, verdi: 'Spesialist' },
                    },
                ],
            },
        ],
        suspendert: false,
    }
}
