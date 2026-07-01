'use client'

import { ThemeProvider } from 'next-themes'
import React, { PropsWithChildren, ReactElement } from 'react'
import { Toaster } from 'sonner'

function Providers({ children }: PropsWithChildren): ReactElement {
    return (
        <ThemeProvider attribute="class">
            {children}
            <Toaster position="bottom-right" toastOptions={{ unstyled: true }} />
        </ThemeProvider>
    )
}

export default Providers
