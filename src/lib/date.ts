import { format, getISODay } from 'date-fns'
import { nb } from 'date-fns/locale/nb'

export type DaysOfWeek = [0, 1, 2, 3, 4, 5, 6]

export type WeekDay = DaysOfWeek[number]

export function getZeroIndexedWeekday(date: Date): WeekDay {
    return (getISODay(date) - 1) as unknown as WeekDay
}

export function toReadableDate(date: string | Date): string {
    return format(date, `d. MMMM yyyy`, { locale: nb })
}

export function toReadableFullDate(date: string | Date): string {
    return format(date, `EEEE, d. MMMM yyyy`, { locale: nb })
}

export function toReadableDateTime(date: string | Date, seconds?: true): string {
    return format(date, `d. MMMM yyyy HH:mm${seconds ? ':ss' : ''}`, { locale: nb })
}
