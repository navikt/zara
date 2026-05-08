import React, { ReactElement } from 'react'
import { PageBlock } from '@navikt/ds-react/Page'

import VaktSidebar from '@features/landing-page/vakt/VaktSidebar'

export default function VaktLayout({ children }: LayoutProps<'/vakt'>): ReactElement {
    return (
        <PageBlock as="main">
            <div className="grid grid-cols-[auto_1fr] h-full">
                <VaktSidebar className="" />
                <div className="">{children}</div>
            </div>
        </PageBlock>
    )
}
