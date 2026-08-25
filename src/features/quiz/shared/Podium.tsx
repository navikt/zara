'use client'

import { Heading } from '@navikt/ds-react'
import { AnimatePresence, motion } from 'motion/react'
import React, { ReactElement } from 'react'

import AliasAvatar from '#features/quiz/shared/AliasAvatar'
import { cn } from '#lib/tw'
import { LeaderboardEntry } from '#services/quiz/quiz-schema'

type Props = {
    /** The full final leaderboard; the podium picks the top three itself. */
    entries: LeaderboardEntry[]
    myPlayerId?: string
}

/** Visual order on the podium: 2nd on the left, 1st in the middle, 3rd on the right. */
const DISPLAY_ORDER = [2, 1, 3]

const STYLES: Record<number, { height: string; block: string; medal: string; label: string }> = {
    1: { height: 'h-40 md:h-56', block: 'bg-ax-bg-warning-moderate', medal: '🥇', label: '1. plass' },
    2: { height: 'h-28 md:h-40', block: 'bg-ax-bg-neutral-moderate', medal: '🥈', label: '2. plass' },
    3: { height: 'h-20 md:h-32', block: 'bg-ax-bg-danger-moderate', medal: '🥉', label: '3. plass' },
}

function PodiumPlace({ entry, myPlayerId }: { entry: LeaderboardEntry; myPlayerId?: string }): ReactElement {
    const style = STYLES[entry.rank]
    const revealed = entry.name != null

    return (
        <div className="flex flex-col justify-end items-center gap-2 grow basis-0 min-w-0">
            <div className="flex flex-col items-center gap-1 w-full min-w-0">
                <AliasAvatar
                    playerId={entry.playerId}
                    alias={entry.alias}
                    name={entry.name}
                    oid={entry.oid}
                    className="size-12 text-2xl"
                />
                <span className="text-sm font-semibold text-center truncate w-full" title={entry.alias}>
                    {entry.alias}
                </span>

                {/* The reveal itself: a placeholder until the host unmasks this place. */}
                <div className="h-7 flex items-center justify-center w-full min-w-0">
                    <AnimatePresence mode="wait">
                        {revealed ? (
                            <motion.span
                                key="name"
                                initial={{ opacity: 0, scale: 0.6, y: 8 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                                className="text-base md:text-lg font-bold text-center truncate w-full"
                                title={entry.name ?? undefined}
                            >
                                {entry.name}
                            </motion.span>
                        ) : (
                            <motion.span
                                key="masked"
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="text-lg font-bold text-ax-text-neutral-subtle tracking-widest"
                            >
                                ???
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>

                <span className="text-sm tabular-nums text-ax-text-neutral-subtle">{entry.points} poeng</span>
            </div>

            <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                className={cn(
                    'w-full rounded-t-md flex flex-col items-center justify-start pt-3 gap-1',
                    style.height,
                    style.block,
                    { 'ring-2 ring-ax-border-accent': entry.playerId === myPlayerId },
                )}
            >
                <span className="text-3xl md:text-4xl">{style.medal}</span>
                <span className="text-xs font-semibold">{style.label}</span>
            </motion.div>
        </div>
    )
}

/**
 * The end-of-quiz podium. Aliases and scores are visible from the start; the real names appear one
 * place at a time as the host works up from 3rd — the server only sends a name once it's revealed,
 * so there is nothing to spoil in the payload.
 */
function Podium({ entries, myPlayerId }: Props): ReactElement | null {
    const top = entries.filter((entry) => entry.rank <= 3)
    if (top.length === 0) return null

    const ordered = DISPLAY_ORDER.flatMap((rank) => top.filter((entry) => entry.rank === rank))

    return (
        <div className="flex flex-col gap-3">
            <Heading level="3" size="small">
                Pallen
            </Heading>
            <div className="flex items-end justify-center gap-2 md:gap-4">
                {ordered.map((entry) => (
                    <PodiumPlace key={entry.playerId} entry={entry} myPlayerId={myPlayerId} />
                ))}
            </div>
        </div>
    )
}

export default Podium
