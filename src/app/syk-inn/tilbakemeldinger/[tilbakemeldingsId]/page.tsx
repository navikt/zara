import React, { ReactElement } from 'react'
import { BodyShort, Heading } from '@navikt/ds-react'
import { PageBlock } from '@navikt/ds-react/Page'
import { ArrowLeftIcon } from '@navikt/aksel-icons'
import Image from 'next/image'

import { AkselNextLink } from '@components/AkselNextLink'
import { validateUserSession } from '@services/auth/auth'
import LiveUsersList from '@components/live-view/LiveUsersList'

import { getFeedbackClient } from '../../../../services/feedback/feedback-client'
import { zaraImages } from '../../../../images/zaras'
import FeedbackAdmin from '../../../../features/syk-inn/feedback/FeedbackAdmin'

async function Page({ params }: PageProps<'/syk-inn/tilbakemeldinger/[tilbakemeldingsId]'>): Promise<ReactElement> {
    const { tilbakemeldingsId } = await params

    const user = await validateUserSession()
    const [client] = getFeedbackClient()
    const feedback = await client.byId(tilbakemeldingsId)

    if (feedback == null) {
        return (
            <PageBlock as="main" width="2xl" gutters>
                <AkselNextLink href="/syk-inn/tilbakemeldinger" className="text-ax-text-neutral-subtle">
                    <ArrowLeftIcon aria-hidden />
                    Tilbake til tilbakemeldinger
                </AkselNextLink>
                <Heading level="2" size="large" spacing>
                    Tilbakemelding ikke funnet
                </Heading>
                <div className="max-w-96 flex flex-col items-center justify-center gap-6">
                    <Image src={zaraImages.mad.src} width={256} height={256} alt="Zara!" />
                    <div>
                        <BodyShort spacing>Kan du ha forsøkt å hente en tilbakemelding som ikke finnes?</BodyShort>
                        <BodyShort spacing>Eller kanskje den har blitt slettet?</BodyShort>
                    </div>
                    <AkselNextLink href="/syk-inn/tilbakemeldinger" className="text-ax-text-neutral-subtle">
                        Tilbake
                    </AkselNextLink>
                </div>
            </PageBlock>
        )
    }

    return (
        <PageBlock as="main" width="2xl" gutters>
            <div className="flex justify-between items-start">
                <div>
                    <AkselNextLink href="/syk-inn/tilbakemeldinger" className="text-ax-text-neutral-subtle">
                        <ArrowLeftIcon aria-hidden />
                        Tilbake til tilbakemeldinger
                    </AkselNextLink>
                    <Heading level="2" size="large">
                        Tilbakemelding fra {feedback.name}
                    </Heading>
                </div>
                <LiveUsersList page={`/syk-inn/tilbakemeldinger/${tilbakemeldingsId}`} me={user} />
            </div>
            <FeedbackAdmin feedback={feedback} />
        </PageBlock>
    )
}

export default Page
