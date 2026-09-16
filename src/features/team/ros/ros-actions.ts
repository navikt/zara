'use server'

import { logger } from '@navikt/next-logger'
import { differenceInSeconds } from 'date-fns'
import { revalidatePath } from 'next/cache'
import { after } from 'next/server'

import { validateUserSession } from '#services/auth/auth'
import { pgClient } from '#services/db/postgres/production-pg'
import { getMsOboToken } from '#services/entra/ms-graph'
import { dumpTryggnokRosData } from '#services/ros/tryggnok-service'

export async function initiateTryggnokSharepointJob(): Promise<void> {
    const user = await validateUserSession('TEAM_MEMBER')
    const client = await pgClient()

    let rowId: string
    const lastRow = await client.query('SELECT * FROM ros ORDER BY last_updated DESC LIMIT 1')
    if (lastRow.rowCount === 0) {
        const inserted = await client.query(
            `INSERT INTO ros (last_updated_by, last_updated, updating) VALUES ($1, now(), true) RETURNING id`,
            [user.userId],
        )
        rowId = inserted.rows[0].id
    } else {
        const previous = lastRow.rows[0]
        if (previous.updating && differenceInSeconds(new Date(), previous.last_updated) < 60) {
            logger.info(`User ${user.name} tried starting ROS-job, but it was already running`)
            return
        }

        await client.query(`UPDATE ros SET last_updated_by = $1, last_updated = now(), updating = true`, [user.userId])
        rowId = lastRow.rows[0].id
    }

    const token = await getMsOboToken()
    after(async () => {
        try {
            await dumpTryggnokRosData(rowId, token)
        } catch (e) {
            logger.error(Error('Failed scraping ROS data from TryggNok', { cause: e }))
        }
    })

    revalidatePath('/team/ros')
}
