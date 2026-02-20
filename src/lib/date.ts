import { format } from 'date-fns'
import { nb } from 'date-fns/locale/nb'

export function toReadableDate(date: string | Date): string {
    return format(date, `d. MMMM yyyy`, { locale: nb })
}

export function toReadableFullDate(date: string | Date): string {
    return format(date, `EEEE, d. MMMM yyyy`, { locale: nb })
}

export function toReadableDateTime(date: string | Date, seconds?: true): string {
    return format(date, `d. MMMM yyyy HH:mm${seconds ? ':ss' : ''}`, { locale: nb })
}
