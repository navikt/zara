import React, { ReactElement } from 'react'
import { Heading } from '@navikt/ds-react'
import { PageBlock } from '@navikt/ds-react/Page'
import { Buildings3Icon } from '@navikt/aksel-icons'

import KontorOversikt from '@features/team/kontor/KontorOversikt'

function Page(): ReactElement {
    return (
        <PageBlock as="main" width="2xl" gutters>
            <div className="flex justify-between items-start">
                <Heading level="2" size="large" spacing className="flex gap-1 items-center">
                    <Buildings3Icon />
                    Kontordager
                </Heading>
            </div>
            <KontorOversikt />
        </PageBlock>
    )
}

export default Page
