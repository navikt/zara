import React, { ReactElement } from 'react'
import { BodyShort, Detail, Heading, Tag } from '@navikt/ds-react'
import { getISOWeek, setISODay, setISOWeek, startOfWeek, set, isAfter, isSameDay, getISODay } from 'date-fns'
import { TZDate } from '@date-fns/tz'
import * as R from 'remeda'
import { nb } from 'date-fns/locale'

import { getMyself, getMyWeek, getTeamWeek } from '@services/team-office/team-office-service'
import { toReadableDate } from '@lib/date'
import WeekToggleView from '@features/team/kontor/WeekToggleView'
import { OfficeUser, TeamWeek, WeekSchedule } from '@services/team-office/types'
import Unregistered from '@features/team/kontor/unregistered/Unregistered'

async function KontorOversikt(): Promise<ReactElement> {
    const me = await getMyself()

    if ('unregistered' in me) {
        return <Unregistered />
    }

    const currentWeek = getISOWeek(new Date())
    const norwayNow = TZDate.tz('Europe/Oslo')
    const friday = set(setISODay(norwayNow, 5), { hours: 10, minutes: 0, seconds: 0, milliseconds: 0 })
    const isAfterTimeOnFriday = isAfter(norwayNow, friday)
    const isFriday = isSameDay(norwayNow, friday)
    const todaysDay = getISODay(norwayNow) - 1

    return (
        <div className="relative">
            <div className="flex flex-col gap-6">
                {isFriday && isAfterTimeOnFriday && (
                    <div className="max-w-prose">
                        <BodyShort>Det er fredag i dag! Oppdater neste ukesplan allerede nå. :)</BodyShort>
                    </div>
                )}
                {isAfterTimeOnFriday ? (
                    <WhoThisWeek label="Kontoret neste uke" week={currentWeek + 1} day={0} />
                ) : (
                    <WhoThisWeek label="Kontoret denne uka" week={currentWeek} day={todaysDay} />
                )}
                {!isAfterTimeOnFriday && <MyWeekView key={`n-${me.default_loc}`} week={currentWeek} me={me} />}
                <MyWeekView key={`n1-${me.default_loc}`} week={currentWeek + 1} me={me} />
                <MyWeekView key={`n2-${me.default_loc}`} week={currentWeek + 2} me={me} />
            </div>
        </div>
    )
}

async function MyWeekView({ week, me }: { week: number; me: OfficeUser }): Promise<ReactElement> {
    const myWeek = await getMyWeek(week, me.default_loc)
    const firstWeekDate = startOfWeek(setISOWeek(new Date(), week), { locale: nb })
    const currentWeek = getISOWeek(new Date())
    const isCurrentWeek = currentWeek === week

    const weekTitleText = isCurrentWeek ? ' (denne uka)' : week === currentWeek + 1 ? ' (neste uke)' : ''

    return (
        <div className="border border-ax-border-neutral-subtle bg-ax-bg-raised p-4 rounded-md grow max-w-prose">
            <Heading level="3" size="medium">
                Din uke {week}
                {weekTitleText}
            </Heading>
            <Detail spacing>Denne uken begynner mandag {toReadableDate(firstWeekDate)}</Detail>
            <WeekToggleView week={week} myWeek={myWeek} />
        </div>
    )
}

async function WhoThisWeek({ day, week, label }: { day: number; week: number; label: string }): Promise<ReactElement> {
    const teamWeek = await getTeamWeek(week)

    return (
        <div className="border border-ax-border-neutral-subtle bg-ax-bg-raised p-4 rounded-md grow max-w-prose">
            <Heading level="3" size="medium">
                {label}
            </Heading>
            <div className="grid grid-cols-2 gap-3">
                {day <= 0 && <Day teamWeek={teamWeek} short="mon" label="Mandag" />}
                {day <= 1 && <Day teamWeek={teamWeek} short="tue" label="Tirsdag" />}
                {day <= 2 && <Day teamWeek={teamWeek} short="wed" label="Onsdag" />}
                {day <= 3 && <Day teamWeek={teamWeek} short="thu" label="Torsdag" />}
                {day <= 4 && <Day teamWeek={teamWeek} short="fri" label="Fredag" />}
            </div>
        </div>
    )
}

function Day({
    teamWeek,
    short,
    label,
}: {
    teamWeek: TeamWeek
    short: keyof WeekSchedule
    label: string
}): ReactElement {
    const onThisDay = R.pipe(
        teamWeek,
        R.filter((it) => it.schedule[short]),
        R.map((it) => it.user),
    )

    return (
        <div className="mt-4 border border-ax-border-info-subtle p-2 rounded-md">
            <Heading level="4" size="xsmall" className="mb-1">
                {label} ({onThisDay.length})
            </Heading>

            {onThisDay.length > 0 ? (
                <div className="flex gap-1 flex-wrap">
                    {onThisDay.map((it) => (
                        <Tag
                            key={it.name}
                            size="small"
                            data-color="brand-blue"
                            variant="moderate"
                            icon={it.default_loc !== 'office' ? <span className="text-sm">✨</span> : undefined}
                        >
                            {it.name}
                        </Tag>
                    ))}
                </div>
            ) : (
                <Detail spacing aria-label="Ingen">
                    👻
                </Detail>
            )}
        </div>
    )
}

export default KontorOversikt
