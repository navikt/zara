import { logger } from '@navikt/next-logger'
import { createCipheriv, randomBytes, scrypt } from 'node:crypto'
import { Pool } from 'pg'

import { bundledEnv } from '#lib/env'
import { raise } from '#lib/ts'
import { LocalMockUser } from '#services/auth/mock'
import { QuizContent } from '#services/quiz/quiz-schema'

/**
 * Dev-only seeding of a LEGACY quiz — one encrypted with an owner passphrase, the way quizzes were
 * stored before the app-secret-only change. Production code can no longer produce these (it only
 * decrypts them), so this mirrors the retired `encryptWithPassphrase` to build a realistic row.
 *
 * Use it to verify the one-way upgrade: unlock with the passphrase, save, and the quiz should come
 * back with `salt = NULL` and never ask for a passphrase again.
 */
export const LEGACY_QUIZ_PASSPHRASE = 'kanari-fugl'

const LEGACY_QUIZ_TITLE = 'Gammel kryptert quiz (passordfrase)'

const LEGACY_QUIZ_CONTENT: QuizContent = {
    title: LEGACY_QUIZ_TITLE,
    questions: [
        {
            id: '11111111-1111-4111-8111-111111111111',
            type: 'multiple-choice',
            shuffleChoices: false,
            text: 'Hvilken by er hovedstaden i Norge?',
            timeLimitSeconds: null,
            imageId: null,
            choices: [
                { id: '11111111-1111-4111-8111-11111111aaaa', text: 'Oslo', correct: true },
                { id: '11111111-1111-4111-8111-11111111bbbb', text: 'Bergen', correct: false },
                { id: '11111111-1111-4111-8111-11111111cccc', text: 'Trondheim', correct: false },
            ],
        },
        {
            id: '22222222-2222-4222-8222-222222222222',
            type: 'slider',
            text: 'Hvor mange fylker har Norge (2024)?',
            timeLimitSeconds: 30,
            imageId: null,
            min: 0,
            max: 30,
            step: 1,
            correct: 15,
            tolerance: 2,
        },
        {
            id: '33333333-3333-4333-8333-333333333333',
            type: 'text',
            text: 'Hva heter Norges lengste elv?',
            timeLimitSeconds: null,
            imageId: null,
            acceptedAnswers: ['Glomma', 'Glåma'],
            fuzz: 'low',
        },
    ],
}

/** Mirrors the retired production `encryptWithPassphrase`: scrypt KDF + AES-256-GCM, iv||tag||ct. */
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

/**
 * Inserts (or replaces) a single passphrase-encrypted quiz owned by the local mock user. Idempotent:
 * re-running drops the previously seeded copy so you always get a fresh, still-locked quiz.
 */
export async function seedLegacyPassphraseQuiz(client: Pool): Promise<{ id: string; passphrase: string }> {
    if (bundledEnv.runtimeEnv !== 'local') raise("Don't seed quizzes outside local development!")

    const ownerUserId = LocalMockUser.userId
    const { blob, salt } = await legacyEncrypt(LEGACY_QUIZ_CONTENT, LEGACY_QUIZ_PASSPHRASE)

    // Drop any earlier seed so the quiz is locked again, not left half-upgraded from a previous run.
    await client.query(`DELETE FROM quiz WHERE owner_user_id = $1 AND title = $2`, [ownerUserId, LEGACY_QUIZ_TITLE])

    const result = await client.query<{ id: string }>(
        `INSERT INTO quiz
             (owner_user_id, is_encrypted, content_encrypted, content_plain, salt,
              title, question_count, default_time_limit, last_played_at)
         VALUES ($1, true, $2, NULL, $3, $4, $5, 20, NULL)
         RETURNING id`,
        [ownerUserId, blob, salt, LEGACY_QUIZ_TITLE, LEGACY_QUIZ_CONTENT.questions.length],
    )
    const id = result.rows[0].id

    logger.info(`Seeded legacy passphrase quiz ${id} for ${ownerUserId} (passphrase: ${LEGACY_QUIZ_PASSPHRASE})`)

    return { id, passphrase: LEGACY_QUIZ_PASSPHRASE }
}
