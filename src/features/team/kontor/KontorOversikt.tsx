import React, { ReactElement } from 'react'
import { BodyShort, Detail, Heading } from '@navikt/ds-react'
import Image from 'next/image'
import { getISOWeek, setISODay, setISOWeek, startOfWeek, set, isAfter, isSameDay, getISODay } from 'date-fns'
import { TZDate } from '@date-fns/tz'
import * as R from 'remeda'

import { getMyself, getMyWeek, getTeam, getTeamWeek } from '@services/team-office/team-office-service'
import { zaraImages } from '@images/zaras'
import SelfRegisterButtons from '@features/team/kontor/SelfRegisterButtons'
import { toReadableDate } from '@lib/date'
import WeekToggleView from '@features/team/kontor/WeekToggleView'
import { OfficeUser, TeamWeek, WeekSchedule } from '@services/team-office/types'
import { EntireTeamView } from '@features/team/kontor/EntireTeamView'

async function KontorOversikt(): Promise<ReactElement> {
    const me = await getMyself()

    if ('unregistered' in me) {
        return (
            <div className="flex gap-6 items-center ">
                <div>
                    <Image src={zaraImages.happy.src} width={256} height={256} alt="Zara!" />
                </div>
                <div className="flex flex-col items-center justify-center">
                    <Heading level="3" size="medium" spacing className="mb-8">
                        Hei! Du har ikke registrert deg i teamet enda
                    </Heading>
                    <SelfRegisterButtons />
                </div>
            </div>
        )
    }

    const team = await getTeam()
    const currentWeek = getISOWeek(new Date())
    const location = me.default_loc === 'office' ? 'FA1' : 'remote'

    const norwayNow = TZDate.tz('Europe/Oslo')
    const friday = set(setISODay(norwayNow, 5), { hours: 10, minutes: 0, seconds: 0, milliseconds: 0 })
    const isAfterTimeOnFriday = isAfter(norwayNow, friday)
    const isFriday = isSameDay(norwayNow, friday)
    const todaysDay = getISODay(norwayNow) - 1

    return (
        <div className="relative">
            <Detail className="-mt-4 mb-4">
                Hei {me.name}! Du er registrert som {location}-ansatt. {`<3`}
            </Detail>
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
                {!isAfterTimeOnFriday && <MyWeekView week={currentWeek} me={me} />}
                <MyWeekView week={currentWeek + 1} me={me} />
                <MyWeekView week={currentWeek + 2} me={me} />
            </div>
            <div>
                <EntireTeamView me={me} team={team} />
            </div>
        </div>
    )
}

async function MyWeekView({ week, me }: { week: number; me: OfficeUser }): Promise<ReactElement> {
    const myWeek = await getMyWeek(week, me.default_loc)
    const firstWeekDate = startOfWeek(setISOWeek(new Date(), week))
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
        R.map((it) => `${it.user.name}${it.user.default_loc !== 'office' ? ' ✨' : ''}`),
    )

    return (
        <div className="mt-4">
            <Heading level="4" size="xsmall">
                {label}
            </Heading>
            {onThisDay.length > 0 ? (
                <Detail spacing>{onThisDay.join(', ')}</Detail>
            ) : (
                <Detail spacing aria-label="Ingen">
                    👻
                </Detail>
            )}
        </div>
    )
}

export default KontorOversikt
