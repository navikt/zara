import { LayersIcon } from '@navikt/aksel-icons'
import { Detail, Heading, Skeleton } from '@navikt/ds-react'
import { LocalAlert, LocalAlertHeader, LocalAlertTitle } from '@navikt/ds-react/LocalAlert'
import { Table, TableBody, TableDataCell, TableHeader, TableHeaderCell, TableRow } from '@navikt/ds-react/Table'
import Image from 'next/image'
import React, { ReactElement, Suspense } from 'react'
import * as R from 'remeda'

import { ValidNamespaces } from '#features/vakt/kafka/topic-overview/NamespacePicker'
import { zaraImages } from '#images/zaras'
import { validateUserSession } from '#services/auth/auth'
import { getTopicDetails, getTopicInfo, getTopics } from '#services/kafka/kafka-admin-service'

export async function KafkaTopicsList({ namespace }: { namespace: ValidNamespaces }): Promise<ReactElement> {
    await validateUserSession('UTVIKLER')

    const topics = await getTopics(namespace)
    const details = await Promise.all(topics.map((it) => getTopicDetails(it)))

    return (
        <div>
            {details.map((it) => (
                <div key={it.topic}>
                    <Heading level="3" size="medium" className="flex items-center gap-2">
                        <LayersIcon aria-hidden />
                        {it.topic}
                    </Heading>
                    <Detail className="mb-2">
                        {it.partitions} partisjoner · replikeringsfaktor {it.replicationFactor}
                        {it.underReplicatedPartitions > 0 && ` · ${it.underReplicatedPartitions} under-replikert`}
                        {it.cleanupPolicy && ` · ${it.cleanupPolicy}`}
                        {it.retention && ` · retention ${formatRetention(it.retention)}`}
                    </Detail>
                    <Suspense
                        fallback={
                            <div>
                                <Skeleton width={120} height={24} />
                                <Skeleton variant="rectangle" height={240} />
                            </div>
                        }
                    >
                        <TopicInfo topic={it.topic} />
                    </Suspense>
                </div>
            ))}
        </div>
    )
}

function formatRetention(retentionMs: string): string {
    const ms = Number(retentionMs)
    if (!Number.isFinite(ms) || ms < 0) return 'uendelig'

    const hours = ms / 1000 / 60 / 60
    return hours >= 24 ? `${Math.round(hours / 24)}d` : `${Math.round(hours)}t`
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
                    <Heading level="4" size="small" className="flex items-center gap-1">
                        {team === 'tsm' && (
                            <Image
                                src={zaraImages.happy.src}
                                width={24}
                                height={24}
                                alt="Zara!"
                                className="-mt-1 animate-bounce"
                            />
                        )}
                        {team === 'sykmelding' && <figure className="text-sm animate-spin">🤒</figure>}
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
