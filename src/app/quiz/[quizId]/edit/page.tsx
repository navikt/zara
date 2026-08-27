import { SandboxIcon } from '@navikt/aksel-icons'
import { notFound, redirect } from 'next/navigation'
import React, { ReactElement } from 'react'

import PageHeader from '#components/page/PageHeader'
import QuizBuilder from '#features/quiz/builder/QuizBuilder'
import QuizEditGate from '#features/quiz/builder/QuizEditGate'
import { validateUserSession } from '#services/auth/auth'
import { getQuizContent, getQuizMeta } from '#services/quiz/quiz-store'

async function Page({ params }: PageProps<'/quiz/[quizId]/edit'>): Promise<ReactElement> {
    const user = await validateUserSession('TEAM_MEMBER')
    const { quizId } = await params

    const meta = await getQuizMeta(quizId, user.userId)
    if (!meta) notFound()

    // Played → shared with the team and immutable. Duplicating is the only way to change it.
    if (meta.isShared) redirect(`/quiz/new?from=${quizId}`)
    if (meta.ownerUserId !== user.userId) notFound()

    // No passphrase needed → load the content on the server and edit straight away. Only legacy
    // passphrase-encrypted quizzes render the unlock gate.
    const preloaded = meta.needsPassphrase ? null : await getQuizContent(quizId, user.userId, null)

    return (
        <div className="flex flex-col gap-6">
            <PageHeader heading="Rediger quiz" Icon={SandboxIcon} backTo={{ href: '/quiz', text: 'quiz' }} />
            {preloaded?.ok ? (
                <QuizBuilder
                    existing={{
                        id: quizId,
                        content: preloaded.content,
                        defaultTimeLimit: preloaded.defaultTimeLimit,
                    }}
                />
            ) : (
                <QuizEditGate quizId={quizId} />
            )}
        </div>
    )
}

export default Page
