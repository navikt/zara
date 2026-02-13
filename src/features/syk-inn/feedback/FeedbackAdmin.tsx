'use client'

import React, { ReactElement, useState } from 'react'
import { ScissorsIcon } from '@navikt/aksel-icons'
import { Button, Detail, Heading, Tooltip } from '@navikt/ds-react'
import { Feedback } from '@navikt/syk-zara'

import { UserContact } from './contact/UserContact'
import { UserFeedback } from './message/UserFeedback'
import RedactableUserFeedback from './redaction/RedactableUserFeedback'
import AdminSection from './AdminSection'
import ActivityLog from './ActivityLog'
import DangerAdminSection from './danger/DangerAdminSection'
import { StatusBar } from './FeedbackStatusBar'
import FeedbackDetails from './FeedbackDetails'

type Props = {
    feedback: Feedback
}

export function FeedbackAdmin({ feedback }: Props): ReactElement {
    const [redactMode, setRedactMode] = useState(false)

    return (
        <div className="flex flex-col gap-4">
            <StatusBar feedback={feedback} />
            <AdminSection
                className="max-w-prose"
                heading={
                    <div className="flex justify-between items-center h-8">
                        <Heading size="small" level="4">
                            Tilbakemelding
                        </Heading>
                        {!redactMode ? (
                            <div>
                                <Tooltip content="Gå i sladde-modus">
                                    <Button
                                        onClick={() => setRedactMode(true)}
                                        icon={<ScissorsIcon aria-hidden />}
                                        size="small"
                                        variant="tertiary"
                                        data-color="neutral"
                                    >
                                        Sladding
                                    </Button>
                                </Tooltip>
                            </div>
                        ) : (
                            <Detail className="animate-bounce">Sladdemodus aktiv!</Detail>
                        )}
                    </div>
                }
            >
                {!redactMode ? (
                    <UserFeedback feedback={feedback} />
                ) : (
                    <RedactableUserFeedback feedback={feedback} onRedactionDone={() => setRedactMode(false)} />
                )}
            </AdminSection>

            <AdminSection className="max-w-prose" heading="Info">
                <FeedbackDetails feedback={feedback} />
            </AdminSection>

            {feedback.type === 'CONTACTABLE' && (
                <AdminSection className="max-w-prose" heading="Kontakt">
                    <UserContact feedback={feedback} />
                </AdminSection>
            )}
            <AdminSection className="max-w-prose" heading="Hendelseslogg">
                <ActivityLog feedback={feedback} />
            </AdminSection>
            <AdminSection className="max-w-prose" heading="Admin">
                <DangerAdminSection feedback={feedback} />
            </AdminSection>
        </div>
    )
}
