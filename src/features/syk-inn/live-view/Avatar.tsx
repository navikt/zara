import React, { ReactElement, useState } from 'react'

type Props = {
    id: string
    name: string
}

function Avatar({ id, name }: Props): ReactElement {
    const [error, setError] = useState(false)

    if (error) {
        return (
            <picture className="flex items-center justify-center font-bold text-xl size-8 aspect-square bg-ax-bg-sunken">
                {name.slice(0, 1)}
            </picture>
        )
    }

    return (
        // next/image does NOT enjoy images that might 404, it spams the logs
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={`/api/avatar/${id}`}
            alt={`Avatar of ${name}`}
            className="size-8"
            height={32}
            width={32}
            onError={() => setError(true)}
        />
    )
}

export default Avatar
