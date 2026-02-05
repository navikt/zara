'use client'

import * as R from 'remeda'
import React, { ReactElement, useEffect, useState } from 'react'
import Image from 'next/image'

import useInterval from '@lib/hooks/useInterval'
import { cn } from '@lib/tw'

import { pingMe } from './live-actions'

type ActiveUsers = Record<
    string,
    {
        name: string
        seen: number
    }
>

function FeedbackListLiveViewBadges(): ReactElement {
    const [now, setNow] = useState(() => Date.now())
    const [whoOnline, setWhoOnline] = useState<ActiveUsers>({})

    useInterval(() => {
        setNow(Date.now())
    }, 1000)

    useEffect(() => {
        // Register me as active on mount
        pingMe()
    }, [])

    useInterval(() => {
        // Register our own activity every 5 seconds
        pingMe()

        // Clean up inactive users
        const now = Date.now()
        setWhoOnline(removeStaleUsers(now))
    }, 5000)

    useEffect(() => {
        const es = new EventSource('/syk-inn/tilbakemeldinger/events')

        es.onmessage = (e) => {
            const payload = JSON.parse(e.data)
            setWhoOnline((prev) => ({
                ...prev,
                [payload.oid]: {
                    name: payload.name,
                    seen: Date.now(),
                },
            }))
        }

        return () => {
            es.close()
        }
    }, [setWhoOnline])

    return (
        <div className="flex items-center">
            {R.entries(whoOnline).map(([id, meta]) => {
                const lastSeen = now - meta.seen

                return (
                    <div
                        key={id}
                        className={cn('rounded-full overflow-hidden w-fit border-2 border-ax-border-success', {
                            'opacity-50': lastSeen > 5_000,
                        })}
                    >
                        <Image src={`/api/avatar/${id}`} alt="AH!" height={32} width={32} />
                    </div>
                )
            })}
        </div>
    )
}

function removeStaleUsers(now: number) {
    return (existing: ActiveUsers) => {
        const cleaned: ActiveUsers = {}
        Object.entries(existing).forEach((it) => {
            const lastSeen = now - it[1].seen
            if (lastSeen < 15_000) {
                cleaned[it[0]] = it[1]
            }
        })
        return cleaned
    }
}

export default FeedbackListLiveViewBadges
