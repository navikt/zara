import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

import { getServerEnv } from '#lib/env'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

function getKey(): Buffer {
    return createHash('sha256').update(getServerEnv().queryParamEncryptionSecret).digest()
}

export function encryptQueryParam(value: string): string {
    const iv = randomBytes(IV_LENGTH)
    const cipher = createCipheriv(ALGORITHM, getKey(), iv, { authTagLength: AUTH_TAG_LENGTH })
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
    const authTag = cipher.getAuthTag()

    return Buffer.concat([iv, authTag, encrypted]).toString('base64url')
}

export function decryptQueryParam(token: string): string | null {
    try {
        const data = Buffer.from(token, 'base64url')
        const iv = data.subarray(0, IV_LENGTH)
        const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
        const encrypted = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH)

        const decipher = createDecipheriv(ALGORITHM, getKey(), iv, { authTagLength: AUTH_TAG_LENGTH })
        decipher.setAuthTag(authTag)

        return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
    } catch {
        return null
    }
}
