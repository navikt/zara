import { test, expect } from 'vitest'

import { getZeroIndexedWeekday } from '#lib/date'
import { isWeekday } from '#services/team-office/common/day-utils'

test("isToday should return true for today's date", () => {
    const monday = getZeroIndexedWeekday(new Date('2026-05-25'))
    const tuesday = getZeroIndexedWeekday(new Date('2026-05-26'))
    const wednesday = getZeroIndexedWeekday(new Date('2026-05-27'))
    const thursday = getZeroIndexedWeekday(new Date('2026-05-28'))
    const friday = getZeroIndexedWeekday(new Date('2026-05-29'))
    const saturday = getZeroIndexedWeekday(new Date('2026-05-30'))
    const sunday = getZeroIndexedWeekday(new Date('2026-05-31'))

    expect(isWeekday(monday)).toBe(true)
    expect(isWeekday(tuesday)).toBe(true)
    expect(isWeekday(wednesday)).toBe(true)
    expect(isWeekday(thursday)).toBe(true)
    expect(isWeekday(friday)).toBe(true)
    expect(isWeekday(saturday)).toBe(false)
    expect(isWeekday(sunday)).toBe(false)
})
