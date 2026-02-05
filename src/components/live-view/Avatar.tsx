'use client'

import React, { ReactElement, useState } from 'react'

type Props = {
    id: string
    name: string
}

function Avatar({ id, name }: Props): ReactElement {
    const [imgError, setImgError] = useState(false)

    return (
        <div className="relative size-8 rounded-full bg-ax-bg-meta-purple-moderate overflow-hidden border-2 border-ax-border-success">
            {!imgError && (
                // next/image does NOT enjoy images that might 404, it spams the logs
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    className="h-full w-full absolute top-0 left-0 z-10 border-none"
                    src={`/api/avatar/${id}`}
                    alt=""
                    height={32}
                    width={32}
                    onError={() => setImgError(true)}
                />
            )}
            <div className="h-full w-full flex items-center justify-center font-bold text-xl z-20">
                {name.slice(0, 1)}
            </div>
        </div>
    )
}

export default Avatar
