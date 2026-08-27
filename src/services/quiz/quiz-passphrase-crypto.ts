import { createDecipheriv, scrypt } from 'node:crypto'

/**
 * LEGACY read-only path. Quizzes used to be encrypted under a passphrase the owner typed, which was
 * never stored server-side. New quizzes are encrypted with the app secret instead (see
 * `quiz-crypto.ts`), so nothing encrypts with a passphrase any more — we only keep the ability to
 * DECRYPT old rows (`quiz.salt IS NOT NULL`). The first time such a quiz is saved or played it is
 * re-encrypted with the app secret and its salt is cleared, so these rows die out on their own.
 */
const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16
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

/**
 * Decrypts a legacy blob with the given salt + passphrase. Returns null on the wrong passphrase or any
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
