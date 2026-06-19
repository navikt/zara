import { ComponentType } from 'react'

import {
    AnswerPayload,
    Choice,
    OrderingItem,
    PublicQuestion,
    Question,
    QuestionType,
    RevealData,
    RevealResult,
} from '@services/quiz/quiz-schema'

import MultipleChoiceEditor from './multiple-choice/Editor'
import MultipleChoicePlayInput from './multiple-choice/PlayInput'
import MultipleChoiceReveal from './multiple-choice/Reveal'
import OrderingEditor from './ordering/Editor'
import OrderingPlayInput from './ordering/PlayInput'
import OrderingReveal from './ordering/Reveal'
import SliderEditor from './slider/Editor'
import SliderPlayInput from './slider/PlayInput'
import SliderReveal from './slider/Reveal'
import TextEditor from './text/Editor'
import TextPlayInput from './text/PlayInput'
import TextReveal from './text/Reveal'

/* ───────────────────────────── Builder draft model ───────────────────────────── */

/** Shared, editable fields every draft question carries. */
export type DraftBase = { id: string; text: string; timeLimitSeconds: number | null; imageId: string | null }

export type DraftMultipleChoice = DraftBase & { type: 'multiple-choice'; choices: Choice[] }
export type DraftOrdering = DraftBase & { type: 'ordering'; items: OrderingItem[] }
export type DraftSlider = DraftBase & {
    type: 'slider'
    min: number
    max: number
    step: number
    correct: number
    tolerance: number
}
export type DraftText = DraftBase & { type: 'text'; acceptedAnswers: string[]; fuzz: 'off' | 'low' | 'medium' }

export type DraftQuestion = DraftMultipleChoice | DraftOrdering | DraftSlider | DraftText

/** Narrowed draft for a particular type. */
export type DraftOf<T extends QuestionType> = Extract<DraftQuestion, { type: T }>

/* ───────────────────────────── Component prop contracts ───────────────────────────── */

/** A type's builder editor: edits the type-specific fields of a draft and reports a patch. */
export type EditorProps<T extends QuestionType = QuestionType> = {
    draft: DraftOf<T>
    onChange: (patch: Partial<DraftOf<T>>) => void
}

/** Narrowed public question for a particular type. */
export type PublicQuestionOf<T extends QuestionType> = Extract<PublicQuestion, { type: T }>
export type RevealDataOf<T extends QuestionType> = Extract<RevealData, { type: T }>

/** A type's player input: collects an answer and calls `onAnswer`. `disabled` while submitting. */
export type PlayInputProps<T extends QuestionType = QuestionType> = {
    question: PublicQuestionOf<T>
    onAnswer: (answer: AnswerPayload) => void
    disabled: boolean
}

/** A type's reveal: shows the correct answer and (optionally) this player's result. */
export type RevealProps<T extends QuestionType = QuestionType> = {
    question: PublicQuestionOf<T>
    data: RevealDataOf<T>
    results: RevealResult[]
    /** This player's result, when rendered for a player rather than the host. */
    myResult?: RevealResult
}

export type QuestionTypeModule = {
    Editor: ComponentType<EditorProps>
    PlayInput: ComponentType<PlayInputProps>
    Reveal: ComponentType<RevealProps>
    /** Builds a fresh draft (correct-answer defaults) when the builder switches to this type. */
    blankDraft: (base: DraftBase) => DraftQuestion
    label: string
}

/* ───────────────────────────── Default-draft factories ───────────────────────────── */

const uuid = (): string => crypto.randomUUID()

export const QUESTION_TYPES: Record<QuestionType, QuestionTypeModule> = {
    'multiple-choice': {
        Editor: MultipleChoiceEditor as ComponentType<EditorProps>,
        PlayInput: MultipleChoicePlayInput as ComponentType<PlayInputProps>,
        Reveal: MultipleChoiceReveal as ComponentType<RevealProps>,
        label: 'Flervalg',
        blankDraft: (base) => ({
            ...base,
            type: 'multiple-choice',
            choices: [
                { id: uuid(), text: '', correct: true },
                { id: uuid(), text: '', correct: false },
            ],
        }),
    },
    ordering: {
        Editor: OrderingEditor as ComponentType<EditorProps>,
        PlayInput: OrderingPlayInput as ComponentType<PlayInputProps>,
        Reveal: OrderingReveal as ComponentType<RevealProps>,
        label: 'Rekkefølge',
        blankDraft: (base) => ({
            ...base,
            type: 'ordering',
            items: [
                { id: uuid(), text: '' },
                { id: uuid(), text: '' },
                { id: uuid(), text: '' },
            ],
        }),
    },
    slider: {
        Editor: SliderEditor as ComponentType<EditorProps>,
        PlayInput: SliderPlayInput as ComponentType<PlayInputProps>,
        Reveal: SliderReveal as ComponentType<RevealProps>,
        label: 'Glidebryter',
        blankDraft: (base) => ({
            ...base,
            type: 'slider',
            min: 0,
            max: 100,
            step: 1,
            correct: 50,
            tolerance: 10,
        }),
    },
    text: {
        Editor: TextEditor as ComponentType<EditorProps>,
        PlayInput: TextPlayInput as ComponentType<PlayInputProps>,
        Reveal: TextReveal as ComponentType<RevealProps>,
        label: 'Fritekst',
        blankDraft: (base) => ({
            ...base,
            type: 'text',
            acceptedAnswers: [''],
            fuzz: 'low',
        }),
    },
}

export const QUESTION_TYPE_ORDER: QuestionType[] = ['multiple-choice', 'ordering', 'slider', 'text']

/**
 * Turns a validated draft into the persisted {@link Question}. Assumes the builder already
 * validated required fields (non-empty texts, sensible numbers); trims user text.
 */
export function draftToQuestion(draft: DraftQuestion): Question {
    const base = {
        id: draft.id,
        text: draft.text.trim(),
        timeLimitSeconds: draft.timeLimitSeconds,
        imageId: draft.imageId,
    }
    switch (draft.type) {
        case 'multiple-choice':
            return {
                ...base,
                type: 'multiple-choice',
                choices: draft.choices.map((c) => ({ id: c.id, text: c.text.trim(), correct: c.correct })),
            }
        case 'ordering':
            return {
                ...base,
                type: 'ordering',
                items: draft.items.map((it) => ({ id: it.id, text: it.text.trim() })),
            }
        case 'slider':
            return {
                ...base,
                type: 'slider',
                min: draft.min,
                max: draft.max,
                step: draft.step,
                correct: draft.correct,
                tolerance: draft.tolerance,
            }
        case 'text':
            return {
                ...base,
                type: 'text',
                acceptedAnswers: draft.acceptedAnswers.map((a) => a.trim()).filter((a) => a.length > 0),
                fuzz: draft.fuzz,
            }
    }
}

/** Builds a draft from a persisted question (when editing an existing quiz). */
export function questionToDraft(question: Question): DraftQuestion {
    const base: DraftBase = {
        id: question.id,
        text: question.text,
        timeLimitSeconds: question.timeLimitSeconds,
        imageId: question.imageId,
    }
    switch (question.type) {
        case 'multiple-choice':
            return { ...base, type: 'multiple-choice', choices: question.choices.map((c) => ({ ...c })) }
        case 'ordering':
            return { ...base, type: 'ordering', items: question.items.map((it) => ({ ...it })) }
        case 'slider':
            return {
                ...base,
                type: 'slider',
                min: question.min,
                max: question.max,
                step: question.step,
                correct: question.correct,
                tolerance: question.tolerance,
            }
        case 'text':
            return { ...base, type: 'text', acceptedAnswers: [...question.acceptedAnswers], fuzz: question.fuzz }
    }
}
