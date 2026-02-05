import { EventEmitter } from 'node:events'

import { nextleton } from 'nextleton'

import { Pages } from '@services/live-service/pages'

const emitter = nextleton('live-emitter', () => {
    return new EventEmitter()
})

type User = {
    oid: string
    name: string
}

export const liveService = {
    userOnPage: (user: User, page: Pages) => {
        emitter.emit('userOnPage', { user, page })
    },
    seeUsersOnPage: (page: Pages, callback: (user: User) => void) => {
        const handler = (data: { user: User; page: Pages }): void => {
            if (data.page === page) {
                callback(data.user)
            }
        }

        emitter.on('userOnPage', handler)

        return () => {
            emitter.off('userOnPage', handler)
        }
    },
}
