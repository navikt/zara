'use client'

import * as R from 'remeda'
import { type Bruksvilkar } from '@navikt/syk-zara/bruksvilkar'
import React, { ReactElement, useState } from 'react'
import { SortState, Table, Link, Heading } from '@navikt/ds-react'

import { toReadableDateTime } from '@lib/date'

type Props = {
    bruksvilkar: Bruksvilkar[]
}

type SortableKeys = keyof Pick<Bruksvilkar, 'acceptedAt' | 'name' | 'org' | 'version' | 'system'>

function BruksvilkarTable({ bruksvilkar }: Props): ReactElement {
    const [sort, setSort] = useState<(SortState & { orderBy: SortableKeys }) | null>()
    const handleSort = (sortKey: SortableKeys): void => {
        setSort(
            sort && sortKey === sort.orderBy && sort.direction === 'descending'
                ? undefined
                : {
                      orderBy: sortKey,
                      direction:
                          sort && sortKey === sort.orderBy && sort.direction === 'ascending'
                              ? 'descending'
                              : 'ascending',
                  },
        )
    }
    const sortedData =
        sort == null || sort.direction === 'none'
            ? R.sortBy(bruksvilkar, [(it) => it.acceptedAt, 'desc'])
            : R.sortBy(bruksvilkar, [(it) => it[sort.orderBy], sort.direction === 'ascending' ? 'asc' : 'desc'])

    return (
        <div>
            <Heading size="medium" className="ml-3">
                Tabell over alle brukere som har godtatt bruksvilkår ({bruksvilkar.length})
            </Heading>
            <Table sort={sort ?? undefined} onSortChange={(sortKey) => handleSort(sortKey as SortableKeys)}>
                <Table.Header>
                    <Table.Row>
                        <Table.ColumnHeader sortKey={'acceptedAt' satisfies SortableKeys} sortable>
                            Tidspunkt
                        </Table.ColumnHeader>
                        <Table.ColumnHeader sortKey={'name' satisfies SortableKeys} sortable>
                            Navn
                        </Table.ColumnHeader>
                        <Table.ColumnHeader>HPR</Table.ColumnHeader>
                        <Table.ColumnHeader sortKey={'org' satisfies SortableKeys} sortable>
                            Orgnummer
                        </Table.ColumnHeader>
                        <Table.ColumnHeader sortKey={'version' satisfies SortableKeys} sortable>
                            Versjon
                        </Table.ColumnHeader>
                        <Table.ColumnHeader sortKey={'system' satisfies SortableKeys} sortable>
                            EPJ
                        </Table.ColumnHeader>
                        <Table.ColumnHeader>Hash</Table.ColumnHeader>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {sortedData.map((bv) => {
                        return (
                            <Table.Row key={bv.hpr + bv.version}>
                                <Table.DataCell>{toReadableDateTime(bv.acceptedAt)}</Table.DataCell>
                                <Table.DataCell>{bv.name}</Table.DataCell>
                                <Table.DataCell>{bv.hpr}</Table.DataCell>
                                <Table.DataCell>{bv.org}</Table.DataCell>
                                <Table.DataCell>{bv.version}</Table.DataCell>
                                <Table.DataCell>{bv.system}</Table.DataCell>
                                <Table.DataCell>
                                    <Link
                                        href={`https://github.com/navikt/syk-inn/blob/${bv.hash}/docs/bruksvilkar.mdx`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {bv.hash.slice(0, 6)}
                                    </Link>
                                </Table.DataCell>
                            </Table.Row>
                        )
                    })}
                </Table.Body>
            </Table>
        </div>
    )
}

export default BruksvilkarTable
