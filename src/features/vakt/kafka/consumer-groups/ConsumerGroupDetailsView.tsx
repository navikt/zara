'use client'

import { BodyShort, Detail, Heading, Table, Tag } from '@navikt/ds-react'
import React, { ReactElement } from 'react'

import { ConsumerGroupDetails } from '#services/kafka/types'

import TopicOffsetActions from './TopicOffsetActions'

type Props = {
    details: ConsumerGroupDetails
}
function ConsumerGroupDetailsView({ details }: Props): ReactElement {
    return (
        <div className="mt-4 max-w-prose">
            <Heading size="small" level="4">
                Consumer group
            </Heading>
            <div className="border border-ax-border-neutral-subtle bg-ax-bg-raised p-4 rounded-md rounded-r-none grow flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <BodyShort className="font-mono font-bold break-all">{details.groupId}</BodyShort>
                    <div className="flex items-center gap-3 flex-wrap">
                        <Tag size="small" variant={details.active ? 'success' : 'neutral'}>
                            {details.active ? 'Aktiv' : 'Inaktiv'} · {details.state}
                        </Tag>
                        <Detail>
                            Medlemmer: <span className="font-bold">{details.memberCount}</span> · Total lag:{' '}
                            <span className="font-bold">{details.totalLag}</span>
                        </Detail>
                    </div>
                </div>

                {details.topics.length === 0 ? (
                    <BodyShort size="small" className="italic">
                        Ingen committede offsets for denne gruppen.
                    </BodyShort>
                ) : (
                    details.topics.map((topic) => (
                        <div key={topic.topic}>
                            <div className="flex items-start justify-between gap-2 mb-1">
                                <Heading size="xsmall" level="5" className="font-mono break-all">
                                    {topic.topic} (lag {topic.totalLag})
                                </Heading>
                                <TopicOffsetActions
                                    groupId={details.groupId}
                                    topic={topic.topic}
                                    active={details.active}
                                />
                            </div>
                            <Table size="small">
                                <Table.Header>
                                    <Table.Row>
                                        <Table.HeaderCell scope="col">Partisjon</Table.HeaderCell>
                                        <Table.HeaderCell scope="col" align="right">
                                            Current
                                        </Table.HeaderCell>
                                        <Table.HeaderCell scope="col" align="right">
                                            End
                                        </Table.HeaderCell>
                                        <Table.HeaderCell scope="col" align="right">
                                            Lag
                                        </Table.HeaderCell>
                                    </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                    {topic.partitions.map((p) => (
                                        <Table.Row key={p.partition}>
                                            <Table.DataCell>{p.partition}</Table.DataCell>
                                            <Table.DataCell align="right">{p.currentOffset}</Table.DataCell>
                                            <Table.DataCell align="right">{p.endOffset}</Table.DataCell>
                                            <Table.DataCell align="right">{p.lag}</Table.DataCell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

export default ConsumerGroupDetailsView
