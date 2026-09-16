import { PageBlock } from '@navikt/ds-react/Page'
import { notFound } from 'next/navigation'
import React, { ReactElement, Suspense } from 'react'

import { CringeCatIcon } from '#components/FakeIcons'
import PageHeader from '#components/page/PageHeader'
import { RosOversikt } from '#features/team/ros/RosOversikt'
import { RosStatus } from '#features/team/ros/RosStatus'
import { bundledEnv } from '#lib/env'

function RosPage(): ReactElement {
    if (bundledEnv.runtimeEnv === 'dev-gcp') notFound()

    return (
        <PageBlock as="main" width="2xl" gutters>
            <PageHeader heading="Riskoanalyser" Icon={CringeCatIcon}>
                <Suspense fallback={null}>
                    <RosStatus />
                </Suspense>
            </PageHeader>
            <Suspense fallback={<div>TODO: Bedre loading state...</div>}>
                <RosOversikt />
            </Suspense>
        </PageBlock>
    )
}

export default RosPage
