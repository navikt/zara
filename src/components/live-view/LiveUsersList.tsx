'use client'

import * as R from 'remeda'
import { motion, AnimatePresence } from 'motion/react'
import React, { ReactElement, useEffect, useState } from 'react'
import { Tooltip } from '@navikt/ds-react'
import { faker } from '@faker-js/faker'

import useInterval from '@lib/hooks/useInterval'
import { cn } from '@lib/tw'
import { bundledEnv } from '@lib/env'
import { User } from '@services/auth/user'
import Avatar from '@components/live-view/Avatar'
import { Pages } from '@services/live-service/pages'
import { meActive } from '@components/live-view/live-actions'

type ActiveUsers = Record<
    string,
    {
        name: string
        seen: number
    }
>

type Props = {
    page: Pages
    me: User
}

function LiveUsersList({ page, me }: Props): ReactElement {
    const [now, setNow] = useState(() => Date.now())
    const [whoOnline, setWhoOnline] = useState<ActiveUsers>(() => ({
        [me.oid]: {
            name: me.name,
            seen: Date.now(),
        },
    }))

    useLocalDevUsers(setWhoOnline)

    useInterval(() => {
        setNow(Date.now())
    }, 1000)

    useEffect(() => {
        setTimeout(() => {
            // Register me as active on mount
            meActive(page)
        }, 69)
    }, [page])

    useInterval(() => {
        // Register our own activity every 5 seconds
        meActive(page)

        // Clean up inactive users
        const now = Date.now()
        setWhoOnline(removeStaleUsers(now))
    }, 5000)

    useEffect(() => {
        const es = new EventSource(`/api/events?page=${page}`)

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
    }, [page, setWhoOnline])

    return (
        <motion.ul layout className="flex items-center gap-1">
            <AnimatePresence>
                {R.entries(whoOnline).map(([id, meta]) => {
                    const lastSeen = now - meta.seen

                    return (
                        <motion.li
                            key={id}
                            layout
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            transition={{ duration: 0.25 }}
                            className={cn('overflow-hidden w-fit', {
                                'opacity-50!': lastSeen > 5_000,
                            })}
                        >
                            <Tooltip content={meta.name}>
                                <div>
                                    <Avatar id={id} name={meta.name} />
                                </div>
                            </Tooltip>
                        </motion.li>
                    )
                })}
            </AnimatePresence>
        </motion.ul>
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

function useLocalDevUsers(
    setWhoOnline: (value: ((prevState: ActiveUsers) => ActiveUsers) | ActiveUsers) => void,
): void {
    useInterval(() => {
        if (bundledEnv.runtimeEnv !== 'local') {
            return
        }

        setWhoOnline((prev) => ({
            ...prev,
            [crypto.randomUUID()]: {
                name: faker.person.fullName(),
                seen: Date.now(),
            },
        }))
    }, 13337)
}

export default LiveUsersList
