import * as R from 'remeda'

import { DefaultWeekSchedule, Location, WeekSchedule } from './types'

export function toDefaultSchedule(location: Location, rawSchedule?: WeekSchedule): DefaultWeekSchedule {
    if (rawSchedule == null) return defaultSchedule(location)

    const days: WeekSchedule = R.pick(rawSchedule, ['mon', 'tue', 'wed', 'thu', 'fri'])
    if (Object.values(days).some((value) => value == null)) {
        return defaultSchedule(location)
    }

    if (Object.values(rawSchedule).some((value) => value == null)) {
        throw new Error('Invalid schedule: some days are null while others are not. Should be impossible.')
    }

    return { ...(days as unknown as Omit<DefaultWeekSchedule, 'isDefault'>), isDefault: false }
}

function defaultSchedule(location: Location): DefaultWeekSchedule {
    switch (location) {
        case 'office':
            return { isDefault: true, mon: false, tue: true, wed: true, thu: false, fri: false }
        case 'remote':
        case 'away':
            return { isDefault: true, mon: false, tue: false, wed: false, thu: false, fri: false }
    }
}
