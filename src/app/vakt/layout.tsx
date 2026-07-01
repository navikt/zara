import { PageBlock } from '@navikt/ds-react/Page'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import React, { ReactElement } from 'react'

import VaktSidebar from '#features/vakt/VaktSidebar'

export default function VaktLayout({ children }: LayoutProps<'/vakt'>): ReactElement {
    return (
        <NuqsAdapter>
            <PageBlock as="main">
                <div className="grid grid-cols-[auto_1fr] h-full">
                    <VaktSidebar />
                    <div className="">{children}</div>
                </div>
            </PageBlock>
        </NuqsAdapter>
    )
}
