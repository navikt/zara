import React, { ReactElement } from 'react'
import * as R from 'remeda'
import { Detail, Heading } from '@navikt/ds-react'
import Image from 'next/image'
import { getISOWeek, setISOWeek, startOfWeek } from 'date-fns'

import { getMyself, getMyWeek, getTeam } from '@services/team-office/team-office-service'
import { zaraImages } from '@images/zaras'
import SelfRegisterButtons from '@features/team/kontor/SelfRegisterButtons'
import { toReadableDate } from '@lib/date'
import WeekToggleView from '@features/team/kontor/WeekToggleView'
import { KontorUser } from '@services/team-office/types'

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

    const currentWeek = getISOWeek(new Date())
    const location = me.default_loc === 'office' ? 'FA1' : 'remote'

    return (
        <div className="relative">
            <Detail className="-mt-4 mb-4">
                Hei {me.name}! Du er registrert som {location}-ansatt. {`<3`}
            </Detail>
            <div className="flex flex-col gap-12">
                <MyWeekView week={currentWeek} me={me} />
                <MyWeekView week={currentWeek + 1} me={me} />
            </div>
            <div>
                <EntireTeamView />
            </div>
        </div>
    )
}

async function MyWeekView({ week, me }: { week: number; me: KontorUser }): Promise<ReactElement> {
    const myWeek = await getMyWeek(week)
    const firstWeekDate = startOfWeek(setISOWeek(new Date(), week))

    return (
        <div className="">
            <Heading level="3" size="small">
                Din uke {week}
            </Heading>
            <Detail spacing>Denne uken begynner mandag {toReadableDate(firstWeekDate)}</Detail>
            <WeekToggleView week={week} me={me} myWeek={myWeek} />
        </div>
    )
}

async function EntireTeamView(): Promise<ReactElement> {
    const team = await getTeam()
    const [office, remote] = R.partition(team, (member) => member.default_loc === 'office')

    return (
        <div className="bg-ax-bg-sunken border border-ax-border-neutral-subtle p-3 rounded-md absolute w-64 right-0 top-0">
            <Heading level="4" size="small" spacing>
                FA1
            </Heading>
            <ul className="list-disc pl-5 mb-4">
                {office.map((member) => (
                    <li key={member.id}>{member.name}</li>
                ))}
            </ul>
            <Heading level="4" size="small" spacing>
                Remote
            </Heading>
            <ul className="list-disc pl-5">
                {remote.map((member) => (
                    <li key={member.id}>{member.name}</li>
                ))}
            </ul>
        </div>
    )
}

export default KontorOversikt
