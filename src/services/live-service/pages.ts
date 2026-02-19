export type UserActivity = {
    oid: string
    name: string
    page: Pages
}

export type Pages =
    | '/syk-inn/bruksvilkar'
    | '/syk-inn/tilbakemeldinger'
    | '/syk-inn/tilbakemeldinger/personvernsmodus'
    | `/syk-inn/tilbakemeldinger/${string}`
