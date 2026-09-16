import { logger } from '@navikt/next-logger'

import { pgClient } from '#services/db/postgres/production-pg'
import { fetchAssessments } from '#services/ros/msgraph-tryggnok/fetch-assessments'
import { fetchRisks } from '#services/ros/msgraph-tryggnok/fetch-risks'
import { fetchTiltak } from '#services/ros/msgraph-tryggnok/fetch-tiltak'
import { buildTryggnokTree } from '#services/ros/tryggnok-mapper'

export async function dumpTryggnokRosData(rowId: string, msGraphToken: string): Promise<void> {
    const client = await pgClient()

    try {
        // Fetch assesments and save as ros in ros table
        const assessments = await fetchAssessments(msGraphToken)
        await client.query(`UPDATE ros SET ros = $1, last_updated = now() WHERE id = $2`, [
            JSON.stringify(assessments),
            rowId,
        ])
        logger.info(`ROS ${rowId}: fetched ${assessments.length} assessment(s).`)

        // Fetch risks and save as risks in ros table
        const risks = await fetchRisks(assessments, msGraphToken)
        await client.query(`UPDATE ros SET risks = $1, last_updated = now() WHERE id = $2`, [
            JSON.stringify(risks),
            rowId,
        ])
        logger.info(`ROS ${rowId}: fetched risks for ${risks.length} assessment(s).`)

        // Fetch tiltak and save as tiltak in ros table
        const tiltak = await fetchTiltak(assessments, msGraphToken)
        await client.query(`UPDATE ros SET tiltak = $1, last_updated = now() WHERE id = $2`, [
            JSON.stringify(tiltak),
            rowId,
        ])
        logger.info(`ROS ${rowId}: fetched tiltak for ${tiltak.length} assessment(s).`)

        // All steps succeeded: build the mapped tree and save as result in ros table
        const result = buildTryggnokTree(risks, tiltak)
        await client.query(`UPDATE ros SET result = $1, last_updated = now() WHERE id = $2`, [
            JSON.stringify(result),
            rowId,
        ])
        logger.info(`ROS ${rowId}: built result tree with ${result.length} ROS node(s).`)
    } catch (error) {
        logger.error(new Error(`Failed dumping TryggNok ROS data for row ${rowId}`, { cause: error }))
        throw error
    } finally {
        // If all steps succeed or fails the "updating" column should be set to false
        await client
            .query(`UPDATE ros SET updating = false WHERE id = $1`, [rowId])
            .catch((error: unknown) =>
                logger.error(new Error(`Failed clearing updating flag for ROS row ${rowId}`, { cause: error })),
            )
    }
}
