import React, { ReactElement, useState } from 'react'
import Image from 'next/image'

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
        <Image
            src={`/api/avatar/${id}`}
            alt={`Avatar of ${name}`}
            height={32}
            width={32}
            onError={() => setError(true)}
        />
    )
}

export default Avatar
