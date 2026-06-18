import * as z from 'zod'

/**
 * The persisted quiz content. The whole thing is encrypted as a single blob at rest,
 * so this is the shape that goes in and comes out of `content_encrypted` / `content_plain`.
 */
export const ChoiceSchema = z.object({
    id: z.string(),
    text: z.string().min(1).max(120),
    correct: z.boolean(),
})
export type Choice = z.infer<typeof ChoiceSchema>

export type QuestionType = 'multiple-choice' | 'ordering' | 'slider' | 'text'

/** Fields shared by every question type. `imageId` is reserved for a later picture feature. */
const QuestionBaseSchema = z.object({
    id: z.string(),
    text: z.string().min(1).max(300),
    /** Per-question override of the quiz's default time limit (seconds). Null = use default. */
    timeLimitSeconds: z.number().int().min(5).max(300).nullable(),
    /** Optional attached image (handled by a later feature). Null when there is none. */
    imageId: z.string().nullable(),
})

export const MultipleChoiceQuestionSchema = QuestionBaseSchema.extend({
    type: z.literal('multiple-choice'),
    choices: z
        .array(ChoiceSchema)
        .min(2)
        .max(4)
        .refine((choices) => choices.filter((c) => c.correct).length === 1, {
            message: 'Each question must have exactly one correct choice',
        }),
})
export type MultipleChoiceQuestion = z.infer<typeof MultipleChoiceQuestionSchema>

export const OrderingItemSchema = z.object({ id: z.string(), text: z.string().min(1).max(120) })
export type OrderingItem = z.infer<typeof OrderingItemSchema>

export const OrderingQuestionSchema = QuestionBaseSchema.extend({
    type: z.literal('ordering'),
    /** The stored array order IS the correct order; players see them shuffled. */
    items: z.array(OrderingItemSchema).min(3).max(6),
})
export type OrderingQuestion = z.infer<typeof OrderingQuestionSchema>

export const SliderQuestionSchema = QuestionBaseSchema.extend({
    type: z.literal('slider'),
    min: z.number(),
    max: z.number(),
    step: z.number().int().min(1),
    correct: z.number(),
    tolerance: z.number().gt(0),
})
    .refine((q) => q.min < q.max, { message: 'min must be less than max' })
    .refine((q) => q.correct >= q.min && q.correct <= q.max, { message: 'correct must be within [min, max]' })
export type SliderQuestion = z.infer<typeof SliderQuestionSchema>

export const TextQuestionSchema = QuestionBaseSchema.extend({
    type: z.literal('text'),
    acceptedAnswers: z.array(z.string().min(1)).min(1).max(10),
    fuzz: z.enum(['off', 'low', 'medium']),
})
export type TextQuestion = z.infer<typeof TextQuestionSchema>

export const QuestionSchema = z.discriminatedUnion('type', [
    MultipleChoiceQuestionSchema,
    OrderingQuestionSchema,
    SliderQuestionSchema,
    TextQuestionSchema,
])
export type Question = z.infer<typeof QuestionSchema>

export const QuizContentSchema = z.object({
    title: z.string().min(1).max(160),
    questions: z.array(QuestionSchema).min(1).max(50),
})
export type QuizContent = z.infer<typeof QuizContentSchema>

/** Quiz-level default time limit (seconds); same bounds as a per-question override. */
export const DefaultTimeLimitSchema = z.number().int().min(5).max(300)

/** Listing metadata for a quiz (title/count come from plaintext columns; no decryption needed). */
export type QuizSummary = {
    id: string
    ownerUserId: string
    title: string
    questionCount: number
    defaultTimeLimit: number
    isEncrypted: boolean
    /** True when the content is encrypted with the owner's passphrase (needed to edit/host). */
    needsPassphrase: boolean
    createdAt: string
    lastPlayedAt: string | null
}

/* ───────────────────────────── Answer payloads ───────────────────────────── */

/** What a player submits, discriminated by the question type it answers. */
export const AnswerPayloadSchema = z.discriminatedUnion('type', [
    z.object({ type: z.literal('multiple-choice'), choiceId: z.string() }),
    z.object({ type: z.literal('ordering'), order: z.array(z.string()) }),
    z.object({ type: z.literal('slider'), value: z.number() }),
    z.object({ type: z.literal('text'), text: z.string() }),
])
export type AnswerPayload = z.infer<typeof AnswerPayloadSchema>

/* ───────────────────────────── Live session DTOs ───────────────────────────── */

export type SessionStatus = 'lobby' | 'question' | 'reveal' | 'ended'

/**
 * Authoritative live-session state held in Valkey (shared across pods). Includes the
 * decrypted quiz content (with correct answers) — this is never sent to clients verbatim;
 * the server projects a {@link ClientSessionState} that hides answers until reveal.
 */
export type LiveSession = {
    sessionId: string
    quizId: string
    quizTitle: string
    hostUserId: string
    hostName: string
    status: SessionStatus
    currentIndex: number
    /** Epoch ms the session/lobby was created; fallback for the stats `started_at`. */
    createdAt: number
    /** Epoch ms the first question was shown; null until the quiz starts. Used as the stats `started_at`. */
    playStartedAt: number | null
    /** Epoch ms the current question was shown; null in lobby/ended. */
    currentStartedAt: number | null
    defaultTimeLimit: number
    content: QuizContent
}

export type PlayerPresence = {
    userId: string
    name: string
    oid: string
    /** Has this player submitted an answer for the current question? */
    answered: boolean
}

export type PublicChoice = { id: string; text: string }
export type PublicOrderingItem = { id: string; text: string }

/**
 * What's sent to clients during a question — correct answers are hidden. Discriminated by `type`
 * so each play/reveal component can narrow on it.
 */
export type PublicQuestion = { id: string; text: string; type: QuestionType; imageId: string | null } & (
    | { type: 'multiple-choice'; choices: PublicChoice[] }
    | { type: 'ordering'; items: PublicOrderingItem[] }
    | { type: 'slider'; slider: { min: number; max: number; step: number } }
    | { type: 'text' }
)

/** The correct answer per type, only revealed once the question is over. */
export type RevealData =
    | { type: 'multiple-choice'; correctChoiceId: string }
    | { type: 'ordering'; correctOrder: string[] }
    | { type: 'slider'; correctValue: number }
    | { type: 'text'; acceptedAnswers: string[] }

export type LeaderboardEntry = {
    userId: string
    name: string
    points: number
    correctCount: number
    percent: number
    rank: number
}

export type RevealResult = {
    userId: string
    answer: AnswerPayload | null
    accuracy: number
    correct: boolean
    points: number
}

/**
 * What the host & player browsers render. Correct answers and per-question points are
 * only populated when `status === 'reveal'` (or `'ended'`).
 */
export type ClientSessionState = {
    sessionId: string
    quizTitle: string
    hostUserId: string
    status: SessionStatus
    currentIndex: number
    questionCount: number
    question: PublicQuestion | null
    startedAt: number | null
    timeLimitSeconds: number | null
    players: PlayerPresence[]
    reveal: { data: RevealData; results: RevealResult[] } | null
    leaderboard: LeaderboardEntry[]
}

/** Broadcast on `channel:quiz:<sessionId>`. We always send the full projected state — simplest and robust. */
export type QuizEvent = { type: 'state'; state: ClientSessionState }

/** Entry in the lobby index (`quiz:active-sessions`) shown on the landing page. */
export type ActiveSession = {
    sessionId: string
    quizTitle: string
    hostUserId: string
    hostName: string
    playerCount: number
    status: SessionStatus
}

/** Pushed to lobby subscribers on every change: the current set of active sessions. */
export type LobbyEvent = { type: 'sessions'; sessions: ActiveSession[] }
