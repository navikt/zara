import { PageBlock } from '@navikt/ds-react/Page'
import React, { ReactElement, Suspense } from 'react'

import { CringeCatIcon } from '#components/FakeIcons'
import PageHeader from '#components/page/PageHeader'
import { RosOversikt } from '#features/team/ros/RosOversikt'
import { RosStatus } from '#features/team/ros/RosStatus'

function RosPage(): ReactElement {
    return (
        <PageBlock as="main" width="2xl" gutters>
            <PageHeader heading="Riskoanalyser" Icon={CringeCatIcon}>
                <Suspense fallback={null}>
                    <RosStatus />
                </Suspense>
            </PageHeader>
            <Suspense>
                <RosOversikt />
            </Suspense>
        </PageBlock>
    )
}

export default RosPage
