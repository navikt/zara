import * as z from 'zod'

export const KodeSchema = z.object({
    aktiv: z.boolean(),
    oid: z.number().int(),
    verdi: z.string().nullable(),
})

export const PeriodeSchema = z.object({
    fra: z.string().nullable(),
    til: z.string().nullable(),
})

export const TilleggskompetanseSchema = z.object({
    avsluttetStatus: KodeSchema.nullable(),
    etag: z.string().nullable(),
    gyldig: PeriodeSchema.nullable(),
    id: z.number().int().nullable(),
    type: KodeSchema.nullable(),
})

export const GodkjenningSchema = z.object({
    helsepersonellkategori: KodeSchema.nullable(),
    autorisasjon: KodeSchema.nullable(),
    tillegskompetanse: z.array(TilleggskompetanseSchema).nullable(),
})

export type Behandler = z.infer<typeof BehandlerSchema>
export const BehandlerSchema = z.object({
    godkjenninger: z.array(GodkjenningSchema),
    fnr: z.string().nullable(),
    hprNummer: z.number().int().nullable(),
    fornavn: z.string().nullable(),
    mellomnavn: z.string().nullable(),
    etternavn: z.string().nullable(),
})
