import { BodyShort, Heading, Tag } from '@navikt/ds-react'
import React, { ReactElement } from 'react'

import { medalFor } from '#features/quiz/shared/medal'
import { toReadableDateTime } from '#lib/date'
import { QuizRun } from '#services/quiz/quiz-store'

type Props = {
    runs: QuizRun[]
}

/** Renders the saved results of every finished run of a quiz (newest first). */
function QuizRuns({ runs }: Props): ReactElement {
    if (runs.length === 0) {
        return (
            <BodyShort className="text-ax-text-neutral-subtle italic">
                Ingen fullførte runder ennå. Resultater lagres når verten avslutter en quiz.
            </BodyShort>
        )
    }

    return (
        <div className="flex flex-col gap-4">
            {runs.map((run) => (
                <div key={run.id} className="bg-ax-bg-raised p-4 rounded-md flex flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <Heading level="3" size="small">
                            {toReadableDateTime(run.endedAt)}
                        </Heading>
                        <Tag variant="info" size="small">
                            Lagets totalscore {run.totalPercent}%
                        </Tag>
                    </div>
                    <BodyShort size="small" className="text-ax-text-neutral-subtle">
                        {run.playerCount} spillere · {run.questionCount} spørsmål
                    </BodyShort>
                    <div className="flex flex-col gap-1">
                        {run.players.map((player) => (
                            <div
                                key={`${player.rank}-${player.name}`}
                                className="flex items-center justify-between gap-3 text-sm"
                            >
                                <span className="flex items-center gap-2">
                                    <span className="w-7 text-center tabular-nums">{medalFor(player.rank)}</span>
                                    {player.name}
                                </span>
                                <span className="flex items-center gap-4">
                                    <span className="text-ax-text-neutral-subtle">{player.percent}% riktig</span>
                                    <span className="font-bold tabular-nums">{player.points} poeng</span>
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}

export default QuizRuns
