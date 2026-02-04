import { format } from 'date-fns'
import { nb } from 'date-fns/locale/nb'

export function toReadableDate(date: string | Date): string {
    return format(date, `d. MMMM yyyy`, { locale: nb })
}

export function toReadableDateTime(date: string | Date): string {
    return format(date, `d. MMMM yyyy HH:mm`, { locale: nb })
}
