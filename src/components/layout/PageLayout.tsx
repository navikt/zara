import { Page, PageBlock } from '@navikt/ds-react/Page'
import type { PropsWithChildren, ReactElement, ReactNode } from 'react'

import Sidebar from '../sidebar/Sidebar'

import styles from './PageLayout.module.css'

function PageLayout({
    header,
    children,
}: PropsWithChildren<{
    header: ReactNode
}>): ReactElement {
    return (
        <Page contentBlockPadding="none">
            {header}
            <div className={styles.content}>
                <Sidebar className="p-4 overflow-auto h-full border-r border-r-border-subtle" />
                <PageBlock gutters width="2xl" as="main" className="p-4 overflow-auto">
                    {children}
                </PageBlock>
            </div>
        </Page>
    )
}

export default PageLayout
