'use client'

import * as R from 'remeda'
import { motion, AnimatePresence } from 'motion/react'
import React, { ReactElement, useCallback, useEffect, useState } from 'react'
import { Tooltip } from '@navikt/ds-react'
import { faker } from '@faker-js/faker'

import useInterval from '@lib/hooks/useInterval'
import { cn } from '@lib/tw'
import { bundledEnv } from '@lib/env'
import { User } from '@services/auth/user'
import Avatar from '@components/live-view/Avatar'
import { Pages, UserActivity } from '@services/feedback/pages'
import { meActive } from '@components/live-view/live-actions'

type Props = {
    page: Pages
    me: User
}

function LiveUsersList({ page, me }: Props): ReactElement {
    const now = useNow()
    const { users, registerUser } = useActiveUsers()
    useMyActivity(page)
    useOthersActivity(me.oid, page, registerUser)
    useLocalDevUsers(registerUser)

    return (
        <motion.ul layout className="flex items-center gap-1">
            <AnimatePresence initial={true}>
                <motion.li
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.25 }}
                >
                    <Tooltip content="You are here!">
                        <div>
                            <Avatar id={me.oid} name={me.name} />
                        </div>
                    </Tooltip>
                </motion.li>
            </AnimatePresence>
            <AnimatePresence>
                {R.entries(users).map(([id, meta]) => {
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
                                'opacity-50!': lastSeen > 10_000,
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

/**
 * Keeps you active and visible for other users
 */
function useMyActivity(page: Pages): () => void {
    const pingMe = useCallback(() => {
        meActive(page)
    }, [page])

    // Register me as active on mount
    useEffect(() => {
        pingMe()
    }, [pingMe])

    // Register our own activity every 5 seconds
    useInterval(() => {
        pingMe()
    }, 5000)

    return pingMe
}

type ActiveUsers = Record<
    string,
    {
        name: string
        seen: number
    }
>

function useActiveUsers(): {
    users: ActiveUsers
    registerUser: (user: Omit<UserActivity, 'page'>) => void
} {
    const [activeUsers, setActiveUsers] = useState<ActiveUsers>(() => ({}))

    // Clean up inactive users every now and then
    useInterval(() => {
        const now = Date.now()

        setActiveUsers(removeStaleUsers(now))
    }, 5000)

    const registerUser = useCallback((user: Omit<UserActivity, 'page'>) => {
        setActiveUsers((prev) => ({
            ...prev,
            [user.oid]: {
                name: user.name,
                seen: Date.now(),
            },
        }))
    }, [])

    return { users: activeUsers, registerUser: registerUser }
}

function useOthersActivity(myOid: string, page: Pages, registerUser: (user: UserActivity) => void): void {
    useEffect(() => {
        const es = new EventSource(`/api/events?page=${page}`)

        es.onmessage = (e) => {
            const payload: UserActivity = JSON.parse(e.data)
            // Skip meself! Yarr!
            if (payload.oid === myOid) return

            registerUser(payload)
        }

        return () => {
            es.close()
        }
    }, [myOid, page, registerUser])
}

function useNow(): number {
    const [now, setNow] = useState(() => Date.now())

    useInterval(() => {
        setNow(Date.now())
    }, 1000)

    return now
}

function removeStaleUsers(now: number) {
    return (existing: ActiveUsers) => {
        const cleaned: ActiveUsers = {}
        Object.entries(existing).forEach((it) => {
            const lastSeen = now - it[1].seen
            if (lastSeen < 30_000) {
                cleaned[it[0]] = it[1]
            }
        })
        return cleaned
    }
}

function useLocalDevUsers(registerUser: (user: Omit<UserActivity, 'page'>) => void): void {
    useInterval(() => {
        if (bundledEnv.runtimeEnv !== 'local') return

        registerUser({
            oid: crypto.randomUUID(),
            name: faker.person.fullName(),
        })
    }, 13337)
}

export default LiveUsersList
