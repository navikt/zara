import React, { ReactElement, Suspense } from 'react'
import { notFound } from 'next/navigation'
import { Skeleton } from '@navikt/ds-react'
import { BarChartIcon } from '@navikt/aksel-icons'

import { validateUserSession } from '@services/auth/auth'
import { getQuizMeta, listQuizRuns } from '@services/quiz/quiz-store'
import PageHeader from '@components/page/PageHeader'
import QuizRuns from '@features/quiz/results/QuizRuns'

async function RunsSection({ quizId, userId }: { quizId: string; userId: string }): Promise<ReactElement> {
    const runs = await listQuizRuns(quizId, userId)
    return <QuizRuns runs={runs} />
}

async function Page({ params }: PageProps<'/quiz/[quizId]/results'>): Promise<ReactElement> {
    const user = await validateUserSession('TEAM_MEMBER')
    const { quizId } = await params

    const quiz = await getQuizMeta(quizId, user.userId)
    if (!quiz) notFound()

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                heading={`Resultater – ${quiz.title}`}
                Icon={BarChartIcon}
                backTo={{ href: '/quiz', text: 'quiz' }}
            />
            <Suspense fallback={<Skeleton variant="rounded" width="100%" height={200} />}>
                <RunsSection quizId={quizId} userId={user.userId} />
            </Suspense>
        </div>
    )
}

export default Page
