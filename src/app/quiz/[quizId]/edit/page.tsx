import React, { ReactElement } from 'react'
import { notFound } from 'next/navigation'
import { SandboxIcon } from '@navikt/aksel-icons'

import { validateUserSession } from '@services/auth/auth'
import { getQuizContent, getQuizMeta } from '@services/quiz/quiz-store'
import PageHeader from '@components/page/PageHeader'
import QuizBuilder from '@features/quiz/builder/QuizBuilder'
import QuizEditGate from '@features/quiz/builder/QuizEditGate'

async function Page({ params }: PageProps<'/quiz/[quizId]/edit'>): Promise<ReactElement> {
    const user = await validateUserSession('TEAM_MEMBER')
    const { quizId } = await params

    const meta = await getQuizMeta(quizId, user.userId)
    if (!meta) notFound()

    // No passphrase needed → load the content on the server and edit straight away. Passphrase-
    // encrypted → render the unlock gate, since only the owner's passphrase can derive the key.
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
