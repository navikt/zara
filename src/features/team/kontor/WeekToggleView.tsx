'use client'

import * as R from 'remeda'
import { Checkbox, CheckboxGroup, InlineMessage } from '@navikt/ds-react'
import React, { ReactElement, useTransition } from 'react'
import { getISOWeek, getISODay } from 'date-fns'

import { OfficeUser, Location, WeekSchedule } from '@services/team-office/types'
import { toggleWeekDay } from '@features/team/kontor/kontor-actions'

type Props = {
    week: number
    me: OfficeUser
    myWeek: WeekSchedule | null
}

function WeekToggleView({ week, me, myWeek }: Props): ReactElement {
    const currentWeekDay = getISODay(new Date()) - 1
    const isCurrentWeek = getISOWeek(new Date()) === week
    const [isPending, startTransition] = useTransition()
    const [days, setDays] = React.useState<string[]>(() => createInitialToggles(me.default_loc, myWeek))
    const handleChange = (values: string[]): void => {
        setDays(values)
        startTransition(async () => {
            await toggleWeekDay(week, values)
        })
    }

    return (
        <div>
            <CheckboxGroup
                legend={
                    <div className="flex gap-1 items-center">Hvilke dager på kontoret skal du være i uke {week}?</div>
                }
                onChange={handleChange}
                className="[&>.aksel-checkboxes]:flex [&>.aksel-checkboxes]:gap-4 [&>.aksel-checkboxes]:flex-wrap [&>.aksel-checkboxes]:grow"
                value={days}
                disabled={isPending}
            >
                <Checkbox
                    value="0"
                    className="flex flex-col gap-3 items-center justify-center"
                    disabled={isCurrentWeek && currentWeekDay > 0}
                >
                    Mandag
                </Checkbox>
                <Checkbox
                    value="1"
                    className="flex flex-col gap-3 items-center justify-center"
                    disabled={isCurrentWeek && currentWeekDay > 1}
                >
                    Tirsdag
                </Checkbox>
                <Checkbox
                    value="2"
                    className="flex flex-col gap-3 items-center justify-center"
                    disabled={isCurrentWeek && currentWeekDay > 2}
                >
                    Onsdag
                </Checkbox>
                <Checkbox
                    value="3"
                    className="flex flex-col gap-3 items-center justify-center"
                    disabled={isCurrentWeek && currentWeekDay > 3}
                >
                    Torsdag
                </Checkbox>
                <Checkbox
                    value="4"
                    className="flex flex-col gap-3 items-center justify-center"
                    disabled={isCurrentWeek && currentWeekDay > 4}
                >
                    Fredag
                </Checkbox>
            </CheckboxGroup>
            {myWeek == null ? (
                <InlineMessage status="info" className="border border-ax-border-info w-fit p-2 rounded-md mt-4">
                    Dette er standarddagene. Du har ikke gjort noen endringer.
                </InlineMessage>
            ) : (
                <InlineMessage status="success" className="border border-ax-border-info w-fit p-2 rounded-md mt-4">
                    Du har oppdatert dine kontordager for uke {week}!
                </InlineMessage>
            )}
        </div>
    )
}

function createInitialToggles(location: Location, myWeek: WeekSchedule | null): string[] {
    if (!myWeek) {
        switch (location) {
            case 'office':
                // Tuesday and wednesday are default office days
                return ['1', '2']
            case 'remote':
                return []
        }
    }

    return [
        myWeek?.mon ? '0' : null,
        myWeek?.tue ? '1' : null,
        myWeek?.wed ? '2' : null,
        myWeek?.thu ? '3' : null,
        myWeek?.fri ? '4' : null,
    ].filter(R.isNonNull)
}

export default WeekToggleView
