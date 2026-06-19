import { encryptQueryParam, decryptQueryParam } from '@lib/crypto/query-param-encryption'

/**
 * Quiz content is stored encrypted at rest. We reuse the app's AES-256-GCM helpers
 * (pure string crypto keyed by the server-only `queryParamEncryptionSecret`) and just
 * add a JSON layer on top. This is encryption-at-rest, not end-to-end: the server can
 * always decrypt, but anyone with raw database access cannot read the blob.
 */
export function encryptJson(value: unknown): string {
    return encryptQueryParam(JSON.stringify(value))
}

export function decryptJson<T = unknown>(token: string): T | null {
    const decrypted = decryptQueryParam(token)
    if (decrypted == null) return null

    try {
        return JSON.parse(decrypted) as T
    } catch {
        return null
    }
}
