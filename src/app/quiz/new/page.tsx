import { SandboxIcon } from '@navikt/aksel-icons'
import { notFound } from 'next/navigation'
import React, { ReactElement } from 'react'

import PageHeader from '#components/page/PageHeader'
import QuizBuilder from '#features/quiz/builder/QuizBuilder'
import { validateUserSession } from '#services/auth/auth'
import { getPlayableQuizContent } from '#services/quiz/quiz-store'

async function Page({ searchParams }: PageProps<'/quiz/new'>): Promise<ReactElement> {
    const user = await validateUserSession('TEAM_MEMBER')
    const { from } = await searchParams

    // `?from=<quizId>` duplicates an existing quiz: your own, or any quiz the team has shared.
    const source = typeof from === 'string' ? await getPlayableQuizContent(from, user.userId, null) : null
    if (source && !source.ok) notFound()

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                heading={source ? 'Dupliser quiz' : 'Ny quiz'}
                Icon={SandboxIcon}
                backTo={{ href: '/quiz', text: 'quiz' }}
            />
            <QuizBuilder
                template={source ? { content: source.content, defaultTimeLimit: source.defaultTimeLimit } : undefined}
            />
        </div>
    )
}

export default Page
