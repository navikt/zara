import { NuqsAdapter } from 'nuqs/adapters/next/app'
import React, { ReactElement } from 'react'
import { PageBlock } from '@navikt/ds-react/Page'

import { validateUserSession } from '@services/auth/auth'

export default async function QuizLayout({ children }: LayoutProps<'/quiz'>): Promise<ReactElement> {
    await validateUserSession('TEAM_MEMBER')

    return (
        <NuqsAdapter>
            <PageBlock as="main" width="2xl" gutters>
                {children}
            </PageBlock>
        </NuqsAdapter>
    )
}
