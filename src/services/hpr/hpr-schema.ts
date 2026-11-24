import * as z from 'zod'

const KodeSchema = z.object({
    oid: z.int(),
    verdi: z.string(),
})

const GodkjenningSchema = z.object({
    autorisasjon: KodeSchema,
    helsepersonellkategori: KodeSchema,
    tilleggskompetanse: z.array(
        z.object({
            avsluttetStatus: KodeSchema,
            gyldig: z.object({ fra: z.iso.date(), til: z.iso.date().optional() }),
            type: KodeSchema,
        }),
    ),
})

export type Behandler = z.infer<typeof BehandlerSchema>
export const BehandlerSchema = z.object({
    hpr: z.string(),
    ident: z.string(),
    navn: z.object({ fornavn: z.string(), mellomnavn: z.string().optional(), etternavn: z.string() }).optional(),
    godkjenning: z.array(GodkjenningSchema),
    suspendert: z.boolean(),
})
