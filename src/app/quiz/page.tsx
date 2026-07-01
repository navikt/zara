import { PlusIcon, SandboxIcon } from '@navikt/aksel-icons'
import { Heading, Skeleton } from '@navikt/ds-react'
import React, { ReactElement, Suspense } from 'react'

import { AkselNextLinkButton } from '#components/AkselNextLink'
import PageHeader from '#components/page/PageHeader'
import MyQuizzes from '#features/quiz/list/MyQuizzes'
import ActiveSessions from '#features/quiz/lobby/ActiveSessions'
import { validateUserSession } from '#services/auth/auth'
import { listActiveSessions } from '#services/quiz/quiz-session-service'
import { listMyQuizzes } from '#services/quiz/quiz-store'

async function ActiveSessionsSection({ userId }: { userId: string }): Promise<ReactElement> {
    const sessions = await listActiveSessions()
    return <ActiveSessions sessions={sessions} meUserId={userId} />
}

async function MyQuizzesSection({ userId }: { userId: string }): Promise<ReactElement> {
    const quizzes = await listMyQuizzes(userId)
    return <MyQuizzes quizzes={quizzes} />
}

async function Page(): Promise<ReactElement> {
    const user = await validateUserSession('TEAM_MEMBER')

    return (
        <div className="flex flex-col gap-8">
            <PageHeader heading="Quiz" Icon={SandboxIcon}>
                <AkselNextLinkButton title="Lag ny quiz" href="/quiz/new" icon={<PlusIcon aria-hidden />}>
                    Lag ny quiz
                </AkselNextLinkButton>
            </PageHeader>

            <section>
                <Heading level="2" size="medium" spacing>
                    Aktive sesjoner
                </Heading>
                <Suspense fallback={<Skeleton variant="rounded" width="100%" height={80} />}>
                    <ActiveSessionsSection userId={user.userId} />
                </Suspense>
            </section>

            <section>
                <Heading level="2" size="medium" spacing>
                    Mine quizer
                </Heading>
                <Suspense fallback={<Skeleton variant="rounded" width="100%" height={160} />}>
                    <MyQuizzesSection userId={user.userId} />
                </Suspense>
            </section>
        </div>
    )
}

export default Page
