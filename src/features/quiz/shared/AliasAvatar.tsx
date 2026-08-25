'use client'

import React, { ReactElement } from 'react'

import Avatar from '#components/live-view/Avatar'
import { cn } from '#lib/tw'

type Props = {
    playerId: string
    alias: string
    /** Real name, once the host has revealed this player. Switches to their actual photo. */
    name?: string | null
    oid?: string | null
    className?: string
}

/** A stable colour per player so anonymous aliases are still visually distinguishable. */
function hueFor(playerId: string): number {
    let hash = 0
    for (let i = 0; i < playerId.length; i++) {
        hash = (hash * 31 + playerId.charCodeAt(i)) % 360
    }
    return hash
}

/**
 * The avatar for a player who may or may not be unmasked: their real photo once the host has
 * revealed them, otherwise a colour-coded initial derived from the (unguessable) `playerId`.
 */
function AliasAvatar({ playerId, alias, name, oid, className }: Props): ReactElement {
    if (name != null && oid != null) {
        return <Avatar id={oid} name={name} />
    }

    const hue = hueFor(playerId)
    return (
        <div
            className={cn(
                'size-8 rounded-full flex items-center justify-center font-bold text-xl text-white shrink-0',
                className,
            )}
            style={{ backgroundColor: `hsl(${hue} 55% 40%)` }}
            aria-hidden
        >
            {alias.slice(0, 1).toUpperCase()}
        </div>
    )
}

export default AliasAvatar
