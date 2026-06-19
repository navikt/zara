import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'node:crypto'

/**
 * Owner-passphrase encryption for quiz content. The AES key is derived from a passphrase the owner
 * types — it is NEVER stored server-side — so a database dump PLUS the app secret still can't decrypt
 * the questions/answers. (The server does see plaintext transiently while the owner edits or hosts;
 * that's unavoidable for a server-run live quiz.)
 */
const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16
const SALT_LENGTH = 16
const KEY_LENGTH = 32
// scrypt cost: N=2^15 needs ~32MB, so raise maxmem above the 32MB default.
const SCRYPT_OPTS = { N: 2 ** 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }

function deriveKey(passphrase: string, salt: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        scrypt(passphrase.normalize('NFKC'), salt, KEY_LENGTH, SCRYPT_OPTS, (err, derivedKey) => {
            if (err) reject(err)
            else resolve(derivedKey)
        })
    })
}

export type EncryptedContent = { blob: string; salt: string }

/** Encrypts a value under a fresh salt + the passphrase-derived key. Returns the blob and the salt. */
export async function encryptWithPassphrase(value: unknown, passphrase: string): Promise<EncryptedContent> {
    const salt = randomBytes(SALT_LENGTH)
    const key = await deriveKey(passphrase, salt)
    const iv = randomBytes(IV_LENGTH)

    const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })
    const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()])
    const authTag = cipher.getAuthTag()

    return {
        blob: Buffer.concat([iv, authTag, encrypted]).toString('base64url'),
        salt: salt.toString('base64url'),
    }
}

/**
 * Decrypts a blob with the given salt + passphrase. Returns null on the wrong passphrase or any
 * tampering (AES-GCM's auth tag makes a wrong key fail rather than return garbage).
 */
export async function decryptWithPassphrase<T = unknown>(
    blob: string,
    salt: string,
    passphrase: string,
): Promise<T | null> {
    try {
        const key = await deriveKey(passphrase, Buffer.from(salt, 'base64url'))
        const data = Buffer.from(blob, 'base64url')
        const iv = data.subarray(0, IV_LENGTH)
        const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
        const encrypted = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH)

        const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })
        decipher.setAuthTag(authTag)

        return JSON.parse(Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')) as T
    } catch {
        return null
    }
}
