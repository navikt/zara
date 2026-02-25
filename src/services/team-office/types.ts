export type WeekSchedule = {
    mon: null
    tue: null
    wed: null
    thu: null
    fri: null
}

export type DefaultWeekSchedule = {
    isDefault: boolean
    mon: boolean
    tue: boolean
    wed: boolean
    thu: boolean
    fri: boolean
}

export type Location = 'office' | 'remote' | 'away'

export type CronPost = {
    id: string
    week_number: number
    week_year: number
    day: number
    channel_id: string
    message_ts: string
}

export type OfficeUser = {
    id: string
    user_id: string
    name: string
    default_loc: Location
}

export type TeamWeek = {
    user: OfficeUser
    schedule: DefaultWeekSchedule
}[]
