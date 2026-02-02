'use client'

import React, { PropsWithChildren, ReactElement } from 'react'
import { ThemeProvider } from 'next-themes'

function Providers({ children }: PropsWithChildren): ReactElement {
    return <ThemeProvider attribute="class">{children}</ThemeProvider>
}

export default Providers
