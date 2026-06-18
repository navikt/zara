import React, { ReactElement } from 'react'
import { SandboxIcon } from '@navikt/aksel-icons'

import PageHeader from '@components/page/PageHeader'
import QuizBuilder from '@features/quiz/builder/QuizBuilder'

function Page(): ReactElement {
    return (
        <div className="flex flex-col gap-6">
            <PageHeader heading="Ny quiz" Icon={SandboxIcon} backTo={{ href: '/quiz', text: 'quiz' }} />
            <QuizBuilder />
        </div>
    )
}

export default Page
