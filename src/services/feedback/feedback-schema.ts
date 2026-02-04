import * as z from 'zod'
import { formatISO, parseISO } from 'date-fns'

export const NullableValkeyString = z.string().transform((it) => (it.trim() === '' ? null : it))

export const NullableDateTime = z.string().transform((date) => {
    if (date == null || date.trim() === '') return null

    return formatISO(parseISO(date))
})

export const DateTime = z.string().transform((date) => formatISO(parseISO(date)))

export type Feedback = z.infer<typeof FeedbackSchema>
export const FeedbackSchema = z.object({
    id: z.string(),
    name: z.string().nonempty(),
    message: z.string().nonempty(),
    timestamp: DateTime,
    contactType: z.enum(['PHONE', 'EMAIL', 'NONE']),
    contactDetails: NullableValkeyString,
    contactedAt: NullableDateTime,
    contactedBy: NullableValkeyString,
    verifiedContentAt: NullableDateTime,
    verifiedContentBy: NullableValkeyString,
})
