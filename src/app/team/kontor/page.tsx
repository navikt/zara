import React, { ReactElement } from 'react'
import { PageBlock } from '@navikt/ds-react/Page'
import { Buildings3Icon, CogIcon } from '@navikt/aksel-icons'

import KontorOversikt from '@features/team/kontor/KontorOversikt'
import { AkselNextLinkButton } from '@components/AkselNextLink'
import PageHeader from '@components/page/PageHeader'

function Page(): ReactElement {
    return (
        <PageBlock as="main" width="2xl" gutters>
            <PageHeader heading="Kontordager" Icon={Buildings3Icon}>
                <AkselNextLinkButton
                    title="Innstillinger"
                    href="/team/kontor/settings"
                    icon={<CogIcon />}
                    variant="secondary"
                />
            </PageHeader>
            <KontorOversikt />
        </PageBlock>
    )
}

export default Page
