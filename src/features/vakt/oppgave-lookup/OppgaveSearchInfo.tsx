import { Heading } from '@navikt/ds-react'
import React, { ReactElement } from 'react'
import * as R from 'remeda'

import { logAuditEvent } from '#lib/audit-log'
import { raise } from '#lib/ts'
import { validateUserSession } from '#services/auth/auth'
import { oppgaveApiService } from '#services/oppgave/oppgave-service'

type Props = {
    ident: string
}

async function OppgaveSearchInfo({ ident }: Props): Promise<ReactElement> {
    const user = await validateUserSession('TEAM_MEMBER')

    logAuditEvent(
        `Henting oppgave for ident: ${ident}`,
        'audit:read',
        user.navIdent ?? raise(`Unable to audit log for user without navIdent (${user.userId})`),
        ident,
    )

    const oppgaver = await oppgaveApiService.getOppgaverByIdent(ident)

    return (
        <div>
            {oppgaver.map((oppgave) => (
                <div key={oppgave.id} className="mt-4 max-w-prose">
                    <Heading size="small" level="4">
                        Info om oppgave med id {oppgave.id}
                    </Heading>
                    <div className="max-w-prose border border-ax-border-neutral-subtle bg-ax-bg-raised p-4 rounded-md rounded-r-none grow">
                        {R.pipe(
                            oppgave,
                            R.entries(),
                            R.map(([key, data]) => (
                                <div key={key} className="mb-4">
                                    <Heading size="xsmall" level="5" className="mb-1">
                                        {key}
                                    </Heading>
                                    <pre className="p-1 border border-dashed border-ax-border-info-subtle rounded-md">
                                        {JSON.stringify(data, null, 2)}
                                    </pre>
                                </div>
                            )),
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}

export default OppgaveSearchInfo
