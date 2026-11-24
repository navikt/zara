'use client'

import { PlusIcon, TrashIcon } from '@navikt/aksel-icons'
import { BodyShort, Button, TextField } from '@navikt/ds-react'
import React, { ReactElement } from 'react'

import { EditorProps } from '#features/quiz/question-types'
import { MAX_MAJORITY_OPTIONS, MIN_MAJORITY_OPTIONS } from '#services/quiz/quiz-schema'

function MajorityEditor({ draft, onChange }: EditorProps<'majority'>): ReactElement {
    const { options } = draft

    return (
        <div className="flex flex-col gap-3">
            <BodyShort size="small" className="text-ax-text-neutral-subtle">
                Det finnes ingen fasit: spillerne prøver å velge det <strong>flest andre</strong> velger. Det mest
                populære alternativet gir fullt poeng, de andre gir poeng i forhold til hvor mange stemmer de fikk.
                Passer fint til «Hva er best: …»-spørsmål.
            </BodyShort>
            <div className="flex flex-col gap-2">
                {options.map((option, index) => (
                    <div key={option.id} className="flex items-center gap-2">
                        <TextField
                            label={`Alternativ ${index + 1}`}
                            hideLabel
                            placeholder={`Alternativ ${index + 1}`}
                            className="grow"
                            value={option.text}
                            onChange={(e) =>
                                onChange({
                                    options: options.map((o) =>
                                        o.id === option.id ? { ...o, text: e.target.value } : o,
                                    ),
                                })
                            }
                        />
                        <Button
                            variant="tertiary"
                            size="small"
                            icon={<TrashIcon title={`Fjern alternativ ${index + 1}`} />}
                            disabled={options.length <= MIN_MAJORITY_OPTIONS}
                            onClick={() => onChange({ options: options.filter((o) => o.id !== option.id) })}
                        />
                    </div>
                ))}
            </div>
            {options.length < MAX_MAJORITY_OPTIONS && (
                <div>
                    <Button
                        variant="secondary"
                        size="small"
                        icon={<PlusIcon aria-hidden />}
                        onClick={() => onChange({ options: [...options, { id: crypto.randomUUID(), text: '' }] })}
                    >
                        Legg til alternativ
                    </Button>
                </div>
            )}
        </div>
    )
}

export default MajorityEditor
