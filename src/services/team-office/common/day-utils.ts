import { WeekDay } from '@lib/date'

export const DEFAULT_OFFICE_DAYS = [1, 2]

export const WEEK_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri'] as const

export function isWeekday(day: WeekDay): boolean {
    return day <= 4
}
