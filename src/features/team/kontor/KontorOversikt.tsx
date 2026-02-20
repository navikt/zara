import React, { ReactElement } from 'react'
import { BodyShort, Detail, Heading } from '@navikt/ds-react'
import Image from 'next/image'
import { getISOWeek, setISODay, setISOWeek, startOfWeek, set, isAfter, isSameDay } from 'date-fns'
import { TZDate } from '@date-fns/tz'

import { getMyself, getMyWeek, getTeam } from '@services/team-office/team-office-service'
import { zaraImages } from '@images/zaras'
import SelfRegisterButtons from '@features/team/kontor/SelfRegisterButtons'
import { toReadableDate } from '@lib/date'
import WeekToggleView from '@features/team/kontor/WeekToggleView'
import { OfficeUser } from '@services/team-office/types'
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

    return (
        <div className="relative">
            <Detail className="-mt-4 mb-4">
                Hei {me.name}! Du er registrert som {location}-ansatt. {`<3`}
            </Detail>
            <div className="flex flex-col gap-6">
                {isFriday && isAfterTimeOnFriday && (
                    <div className="max-w-prose">
                        <BodyShort>
                            Det er fredag i dag! Husk å si om det er noen dager du ikke kan komme neste uke!
                        </BodyShort>
                    </div>
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
    const myWeek = await getMyWeek(week)
    const firstWeekDate = startOfWeek(setISOWeek(new Date(), week))
    const currentWeek = getISOWeek(new Date())
    const isCurrentWeek = currentWeek === week

    const weekTitleText = isCurrentWeek ? ' (denne uka)' : week === currentWeek + 1 ? ' (neste uke)' : ''

    return (
        <div className="border border-ax-border-neutral-subtle bg-ax-bg-raised p-4 rounded-md w-150 max-w-prose">
            <Heading level="3" size="medium">
                Din uke {week}
                {weekTitleText}
            </Heading>
            <Detail spacing>Denne uken begynner mandag {toReadableDate(firstWeekDate)}</Detail>
            <WeekToggleView week={week} me={me} myWeek={myWeek} />
        </div>
    )
}

export default KontorOversikt
