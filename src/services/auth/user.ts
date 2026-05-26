export type User = {
    name: string
    userId: string
    navIdent: string | null
    // This in the Entra "oid" claim
    oid: string
    groups: string[]
}
