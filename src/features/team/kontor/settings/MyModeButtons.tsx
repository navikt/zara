'use client'

import React, { ReactElement, useState, useTransition } from 'react'
import { Button, Label, Switch } from '@navikt/ds-react'

import { nukeMe, registerKontor } from '@features/team/kontor/kontor-actions'
import { OfficeUser } from '@services/team-office/types'

type Props = {
    me: OfficeUser
}

function MyModeButtons({ me }: Props): ReactElement {
    const [letMeNuke, setLetMeNuke] = useState(false)
    const [isPending, startTransition] = useTransition()

    return (
        <div className="mt-4 flex flex-col gap-2">
            <Label>Sett meg som</Label>
            <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                    variant="secondary"
                    className="w-full"
                    loading={isPending}
                    onClick={() => {
                        startTransition(async () => {
                            await registerKontor('office')
                        })
                    }}
                    disabled={me.default_loc === 'office'}
                >
                    FA1-ansatt
                </Button>
                <Button
                    variant="secondary"
                    className="w-full"
                    loading={isPending}
                    onClick={() => {
                        startTransition(async () => {
                            await registerKontor('remote')
                        })
                    }}
                    disabled={me.default_loc === 'remote'}
                >
                    Remote-ansatt
                </Button>

                <Button
                    variant="secondary"
                    className="w-full"
                    data-color="meta-lime"
                    loading={isPending}
                    onClick={() => {
                        startTransition(async () => {
                            await registerKontor('away')
                        })
                    }}
                    disabled={me.default_loc === 'away'}
                >
                    Langtidsborte
                </Button>
            </div>
            <div className="border-2 border-dotted border-ax-border-danger rounded-md px-2 flex gap-3 items-center mt-2">
                <Switch className="shrink-0" checked={letMeNuke} onClick={() => setLetMeNuke((b) => !b)}>
                    Jeg vil slette meg selv
                </Switch>
                <Button
                    size="small"
                    variant="secondary"
                    className="w-full h-fit"
                    disabled={!letMeNuke}
                    loading={isPending}
                    onClick={() => {
                        startTransition(async () => {
                            await nukeMe()
                        })
                    }}
                >
                    Slett meg
                </Button>
            </div>
        </div>
    )
}

export default MyModeButtons
