import { Detail } from '@navikt/ds-react'
import { connection } from 'next/server'
import { ReactElement } from 'react'

import { AutoUpdatingDistance } from '#components/AutoUpdatingDistance'
import { RosAction } from '#features/team/ros/RosAction'
import { pgClient } from '#services/db/postgres/production-pg'

export async function RosStatus(): Promise<ReactElement> {
    await connection()

    const client = await pgClient()
    const result = await client.query('SELECT * FROM ros LIMIT 1')
    if (result.rowCount === 0) {
        return (
            <div className="relative">
                <Detail className="absolute -bottom-6 right-2">Sist exportert: Aldri</Detail>
                <RosAction />
            </div>
        )
    }

    const ros = result.rows[0]
    return (
        <div className="relative">
            <AutoUpdatingDistance
                prefix="Sist eksportert: "
                time={ros.last_updated}
                className="absolute -bottom-6 right-2 text-nowrap"
            />
            <RosAction />
        </div>
    )
}
