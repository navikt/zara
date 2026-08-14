import { LayersIcon } from '@navikt/aksel-icons'
import { Heading } from '@navikt/ds-react'
import { LocalAlert, LocalAlertHeader, LocalAlertTitle } from '@navikt/ds-react/LocalAlert'
import { Table, TableBody, TableDataCell, TableHeader, TableHeaderCell, TableRow } from '@navikt/ds-react/Table'
import React, { ReactElement, Suspense } from 'react'
import * as R from 'remeda'

import { ValidNamespaces } from '#features/vakt/kafka/topic-overview/NamespacePicker'
import { validateUserSession } from '#services/auth/auth'
import { getTopicInfo, getTopics } from '#services/kafka/kafka-admin-service'

export async function KafkaTopicsList({ namespace }: { namespace: ValidNamespaces }): Promise<ReactElement> {
    await validateUserSession('UTVIKLER')

    const topics = await getTopics(namespace)

    return (
        <div>
            {topics.map((it) => (
                <div key={it}>
                    <Heading level="3" size="medium" className="flex items-center gap-2">
                        <LayersIcon aria-hidden />
                        {it}
                    </Heading>
                    <Suspense fallback={<div>tihi</div>}>
                        <TopicInfo topic={it} />
                    </Suspense>
                </div>
            ))}
        </div>
    )
}

async function TopicInfo({ topic }: { topic: string }): Promise<ReactElement> {
    const info = await getTopicInfo(topic)

    if (info.length === 0) {
        return (
            <div className="max-w-prose my-4">
                <LocalAlert status="warning" size="medium">
                    <LocalAlertHeader>
                        <LocalAlertTitle>Ingen ACL for topic</LocalAlertTitle>
                    </LocalAlertHeader>
                </LocalAlert>
            </div>
        )
    }

    const byTeam = R.pipe(
        info,
        R.groupBy((it) => it.team),
        R.entries(),
        R.sortBy(
            ([team]) => (team === 'tsm' ? 0 : 1),
            ([team]) => team,
        ),
    )

    return (
        <div>
            {byTeam.map(([team, apps]) => (
                <div key={team} className="mb-4">
                    <Heading level="4" size="small">
                        {team}
                    </Heading>
                    <Table size="small" className="w-full table-fixed">
                        <TableHeader>
                            <TableRow>
                                <TableHeaderCell scope="col" className="w-12">
                                    App
                                </TableHeaderCell>
                                <TableHeaderCell scope="col" className="w-32">
                                    Tilgang
                                </TableHeaderCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {R.sortBy(apps, [(it) => it.access, 'desc']).map((it) => (
                                <TableRow key={it.app}>
                                    <TableDataCell>{it.app}</TableDataCell>
                                    <TableDataCell>{it.access}</TableDataCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ))}
        </div>
    )
}
