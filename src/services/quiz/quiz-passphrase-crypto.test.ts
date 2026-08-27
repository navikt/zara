import { createCipheriv, randomBytes, scrypt } from 'node:crypto'
import { test, expect } from 'vitest'

import { decryptWithPassphrase } from '#services/quiz/quiz-passphrase-crypto'

/**
 * Production code no longer encrypts with a passphrase — only legacy rows are decrypted. This mirrors
 * the retired `encryptWithPassphrase` so the tests can still produce realistic legacy blobs.
 */
function legacyEncrypt(value: unknown, passphrase: string): Promise<{ blob: string; salt: string }> {
    const salt = randomBytes(16)

    return new Promise((resolve, reject) => {
        scrypt(
            passphrase.normalize('NFKC'),
            salt,
            32,
            { N: 2 ** 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 },
            (err, key) => {
                if (err) return reject(err)

                const iv = randomBytes(12)
                const cipher = createCipheriv('aes-256-gcm', key, iv, { authTagLength: 16 })
                const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()])

                resolve({
                    blob: Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64url'),
                    salt: salt.toString('base64url'),
                })
            },
        )
    })
}

test('round-trips a legacy value with the correct passphrase', async () => {
    const value = { title: 'Min quiz', questions: [1, 2, 3] }
    const { blob, salt } = await legacyEncrypt(value, 'kanari-fugl')

    expect(await decryptWithPassphrase(blob, salt, 'kanari-fugl')).toEqual(value)
})

test('returns null for the wrong passphrase', async () => {
    const { blob, salt } = await legacyEncrypt({ secret: true }, 'riktig')

    expect(await decryptWithPassphrase(blob, salt, 'feil')).toBeNull()
})

test('returns null for a tampered blob', async () => {
    const { blob, salt } = await legacyEncrypt({ secret: true }, 'riktig')
    const tampered = Buffer.from(blob, 'base64url')
    tampered[tampered.length - 1] ^= 0xff

    expect(await decryptWithPassphrase(tampered.toString('base64url'), salt, 'riktig')).toBeNull()
})
