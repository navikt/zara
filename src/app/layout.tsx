import './globals.css'

import React, { ReactElement } from 'react'
import type { Metadata } from 'next'

import Header from '@components/Header'

import Providers from './providers'

export const metadata: Metadata = {
    title: 'Zara - Verktøy for Team Symfoni',
}

export default function StandaloneLayout({ children }: LayoutProps<'/'>): ReactElement {
    return (
        <html lang="nb" suppressHydrationWarning>
            <head>
                <link rel="icon" href="https://cdn.nav.no/personbruker/decorator-next/public/favicon.ico" sizes="any" />
                <link
                    rel="icon"
                    href="https://cdn.nav.no/personbruker/decorator-next/public/favicon.svg"
                    type="image/svg+xml"
                />
            </head>
            <body>
                <Providers>
                    <Header />
                    {children}
                </Providers>
            </body>
        </html>
    )
}
