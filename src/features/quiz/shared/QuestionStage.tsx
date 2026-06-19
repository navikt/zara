'use client'

import React, { ReactElement } from 'react'

import { PublicQuestion } from '@services/quiz/quiz-schema'

type Props = {
    question: PublicQuestion
}

/** Renders the live question big and centered, with its optional image above. Shared by host & player. */
function QuestionStage({ question }: Props): ReactElement {
    return (
        <div className="flex flex-col items-center gap-4 py-2">
            {question.imageId && (
                // next/image does NOT enjoy auth-gated images that might 404, it spams the logs
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={`/quiz/image/${question.imageId}`}
                    alt=""
                    className="max-h-72 w-auto max-w-full object-contain rounded-md"
                />
            )}
            <p className="text-2xl md:text-4xl font-bold text-center text-balance">{question.text}</p>
        </div>
    )
}

export default QuestionStage
