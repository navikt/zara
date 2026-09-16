'use client'

import { Button } from '@navikt/ds-react'
import { ReactElement, useTransition } from 'react'

import { initiateTryggnokSharepointJob } from '#features/team/ros/ros-actions'

export function RosAction(): ReactElement {
    const [isPending, startTransition] = useTransition()

    return (
        <Button
            loading={isPending}
            variant="secondary"
            onClick={() => {
                startTransition(async () => {
                    await initiateTryggnokSharepointJob()
                })
            }}
        >
            Kjør ROS eksport
        </Button>
    )
}
