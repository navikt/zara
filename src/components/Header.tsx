import { Heading } from '@navikt/ds-react'
import Link from 'next/link'
import { ReactElement, Suspense } from 'react'
import Image from 'next/image'

import { ThemeChanger } from '@components/theme'

import { zaraImages } from '../images/zaras'

import { LoggedInUser, LoggedInUserSkeleton } from './logged-in-user/LoggedInUser'

function Header(): ReactElement {
    return (
        <div className="p-4 border-b-2 border-b-ax-border-meta-purple-subtle flex justify-between h-20 mb-4">
            <Link href="/" className="flex items-center gap-3">
                <Image src={zaraImages.normal.src} height="64" width={64} alt="Zara!" />
                <Heading size="large" level="1">
                    Zara - Team SYMFONI
                </Heading>
            </Link>
            <div className="flex gap-3">
                <ThemeChanger />
                <Suspense fallback={<LoggedInUserSkeleton />}>
                    <LoggedInUser />
                </Suspense>
            </div>
        </div>
    )
}

export default Header
