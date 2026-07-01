import { test, expect } from 'vitest'

import { decryptWithPassphrase, encryptWithPassphrase } from '#services/quiz/quiz-passphrase-crypto'

test('round-trips a value with the correct passphrase', async () => {
    const value = { title: 'Min quiz', questions: [1, 2, 3] }
    const { blob, salt } = await encryptWithPassphrase(value, 'kanari-fugl')

    expect(await decryptWithPassphrase(blob, salt, 'kanari-fugl')).toEqual(value)
})

test('returns null for the wrong passphrase', async () => {
    const { blob, salt } = await encryptWithPassphrase({ secret: true }, 'riktig')

    expect(await decryptWithPassphrase(blob, salt, 'feil')).toBeNull()
})

test('uses a fresh salt per encryption (same input -> different blob)', async () => {
    const a = await encryptWithPassphrase({ x: 1 }, 'pass')
    const b = await encryptWithPassphrase({ x: 1 }, 'pass')

    expect(a.salt).not.toEqual(b.salt)
    expect(a.blob).not.toEqual(b.blob)
})
