export type WeekSchedule = {
    mon: boolean
    tue: boolean
    wed: boolean
    thu: boolean
    fri: boolean
}

export type Location = 'office' | 'remote'

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
