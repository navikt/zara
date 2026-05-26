export const DEFAULT_OFFICE_DAYS = [1, 2]

export const WEEK_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri'] as const

export function isTodayOfficeDay(day: number): boolean {
    return DEFAULT_OFFICE_DAYS.includes(day)
}
