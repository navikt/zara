export type WeekSchedule = {
    mon: boolean
    tue: boolean
    wed: boolean
    thu: boolean
    fri: boolean
}

export type Location = 'office' | 'remote'

export type KontorUser = {
    id: string
    user_id: string
    name: string
    default_loc: Location
}
