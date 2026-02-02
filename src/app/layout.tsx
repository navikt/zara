import './globals.css'

import React, { ReactElement } from 'react'
import type { Metadata } from 'next'
import { Page } from '@navikt/ds-react'

import Header from '@components/Header'

import Providers from './providers'

export const metadata: Metadata = {
    title: 'Zara - Verktøy for Team Symfoni',
}

export default function StandaloneLayout({ children }: LayoutProps<'/'>): ReactElement {
    return (
        <html lang="nb" suppressHydrationWarning>
            <body>
                <Providers>
                    <Page>
                        <Header />
                        {children}
                    </Page>
                </Providers>
            </body>
        </html>
    )
}
