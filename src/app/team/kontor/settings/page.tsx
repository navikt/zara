import React, { ReactElement } from 'react'
import { PageBlock } from '@navikt/ds-react/Page'
import { Buildings3Icon } from '@navikt/aksel-icons'

import KontorSettings from '@features/team/kontor/settings/KontorSettings'
import PageHeader from '@components/page/PageHeader'

function Page(): ReactElement {
    return (
        <PageBlock as="main" width="2xl" gutters>
            <PageHeader
                heading="Innstillinger for kontordager"
                Icon={Buildings3Icon}
                backTo={{ href: '/team/kontor', text: 'kontordager' }}
            />
            <KontorSettings />
        </PageBlock>
    )
}

export default Page
