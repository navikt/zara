import { Heading } from '@navikt/ds-react'
import Link from 'next/link'
import { type ReactElement, Suspense } from 'react'

import { LoggedInUser, LoggedInUserSkeleton } from './logged-in-user/LoggedInUser'
import logo from './logo.webp'

function Header(): ReactElement {
    return (
        <div className="p-4 border-b border-b-border-subtle flex justify-between h-20">
            <Link href="/" className="flex items-center gap-3">
                <img src={logo.src} height="64" width={64} alt="Zara!" />
                <Heading size="large" level="1" className="text-text-default">
                    Zara - Team SYMFONI
                </Heading>
            </Link>
            <div>
                <Suspense fallback={<LoggedInUserSkeleton />}>
                    <LoggedInUser />
                </Suspense>
            </div>
        </div>
    )
}

export default Header
