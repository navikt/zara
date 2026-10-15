'use client'

import { BodyShort, ExpansionCard, Table } from '@navikt/ds-react'
import React, { ReactElement, useId } from 'react'

import { PlayerPresence, RevealResult } from '#services/quiz/quiz-schema'

type Props = {
    players: PlayerPresence[]
    results: RevealResult[]
}

function TextAnswerResults({ players, results }: Props): ReactElement {
    const titleId = useId()
    const resultsByPlayer = new Map(results.map((result) => [result.playerId, result]))

    return (
        <ExpansionCard size="small" aria-labelledby={titleId}>
            <ExpansionCard.Header>
                <ExpansionCard.Title id={titleId}>Vis spillernes svar</ExpansionCard.Title>
            </ExpansionCard.Header>
            <ExpansionCard.Content>
                {players.length === 0 ? (
                    <BodyShort>Ingen spillere.</BodyShort>
                ) : (
                    <div className="overflow-x-auto">
                        <Table size="small">
                            <Table.Header>
                                <Table.Row>
                                    <Table.HeaderCell scope="col">Spiller</Table.HeaderCell>
                                    <Table.HeaderCell scope="col">Svar</Table.HeaderCell>
                                    <Table.HeaderCell scope="col">Resultat</Table.HeaderCell>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {players.map((player) => {
                                    const result = resultsByPlayer.get(player.playerId)
                                    const answer = result?.answer?.type === 'text' ? result.answer.text : null
                                    return (
                                        <Table.Row key={player.playerId}>
                                            <Table.HeaderCell scope="row">{player.alias}</Table.HeaderCell>
                                            <Table.DataCell className="whitespace-pre-wrap break-words">
                                                {answer ?? 'Ikke svart'}
                                            </Table.DataCell>
                                            <Table.DataCell>
                                                {answer == null ? '–' : result?.correct ? 'Riktig' : 'Feil'}
                                            </Table.DataCell>
                                        </Table.Row>
                                    )
                                })}
                            </Table.Body>
                        </Table>
                    </div>
                )}
            </ExpansionCard.Content>
        </ExpansionCard>
    )
}

export default TextAnswerResults
