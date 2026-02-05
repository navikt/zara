'use client'

import React, { ReactElement, useState } from 'react'

type Props = {
    name: string
    oid: string
}

function LoggedInUserAvatar({ name, oid }: Props): ReactElement {
    const [error, setError] = useState(false)

    return (
        <div className="relative size-11 border-2 border-ax-border-neutral-subtle rounded-full overflow-hidden">
            <div className="w-full h-full bg-ax-bg-raised rounded-full flex items-center justify-center text-2xl">
                {name[0]}
            </div>
            {!error && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    className="w-full h-full rounded-full absolute top-0 left-0"
                    src={`/api/avatar/${oid}`}
                    alt=""
                    width={32}
                    onError={() => setError(true)}
                />
            )}
        </div>
    )
}

export default LoggedInUserAvatar
