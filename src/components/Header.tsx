import { ReactElement, Suspense } from 'react'

import { ThemeChanger } from '@components/theme'

import { LoggedInUser, LoggedInUserSkeleton } from './logged-in-user/LoggedInUser'
import LinkHeader from './LinkHeader'

function Header(): ReactElement {
    return (
        <div className="p-4 border-b-2 border-b-ax-border-meta-purple-subtle flex justify-between h-20 mb-4">
            <LinkHeader />
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
