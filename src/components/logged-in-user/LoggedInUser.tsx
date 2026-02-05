import { BodyShort, Detail, Skeleton, Tooltip } from '@navikt/ds-react'
import React, { ReactElement } from 'react'

import { userInfo } from '@services/auth/auth'
import LoggedInUserAvatar from '@components/logged-in-user/LoggedInUserAvatar'

export async function LoggedInUser(): Promise<ReactElement> {
    const user = await userInfo()

    if (user == null) {
        return (
            <div className="flex flex-col items-end justify-center h-full">
                <BodyShort className="w-32 text-right">Ikke logget inn</BodyShort>
            </div>
        )
    }

    return (
        <div className="flex gap-4">
            <div className="hidden sm:block text-right">
                <BodyShort>{user.name}</BodyShort>
                <Detail className="whitespace-nowrap">{user.userId}</Detail>
            </div>

            <Tooltip content={`Logget in som ${user.name} (${user.userId})`}>
                <div>
                    <LoggedInUserAvatar name={user.name} oid={user.oid} />
                </div>
            </Tooltip>
        </div>
    )
}

export function LoggedInUserSkeleton(): ReactElement {
    return (
        <div className="flex gap-4">
            <div>
                <Skeleton width={120} />
                <Skeleton width={60} />
            </div>
            <Skeleton width={48} height={48} variant="circle" />
        </div>
    )
}
