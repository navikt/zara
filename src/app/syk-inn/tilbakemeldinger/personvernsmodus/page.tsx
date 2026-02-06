import React, { ReactElement } from 'react'
import { Detail, Heading } from '@navikt/ds-react'
import { PageBlock } from '@navikt/ds-react/Page'
import { ArrowLeftIcon } from '@navikt/aksel-icons'
import * as R from 'remeda'
import Image from 'next/image'

import LiveUsersList from '@components/live-view/LiveUsersList'
import { validateUserSession } from '@services/auth/auth'
import { AkselNextLink } from '@components/AkselNextLink'
import { getFeedbackClient } from '@services/feedback/feedback-client'
import PrivacyMode from '@components/privacy-mode/PrivacyMode'

import { zaraImages } from '../../../../images/zaras'

async function Page(): Promise<ReactElement> {
    const user = await validateUserSession()
    const [client] = getFeedbackClient()
    const feedback = await client.all()
    const relevant = R.pipe(
        feedback,
        R.filter((it) => it.verifiedContentAt == null),
        R.sortBy([(it) => it.timestamp, 'desc']),
    )

    return (
        <PageBlock as="main" width="2xl" gutters>
            <div className="flex justify-between items-start">
                <div>
                    <AkselNextLink href="/syk-inn/tilbakemeldinger" className="text-ax-text-neutral-subtle">
                        <ArrowLeftIcon aria-hidden />
                        Tilbake til tilbakemeldinger
                    </AkselNextLink>
                    <Heading level="2" size="large">
                        Personvernsmodus!
                    </Heading>
                </div>
                <LiveUsersList page="/syk-inn/tilbakemeldinger/personvernsmodus" me={user} />
            </div>
            {relevant.length > 0 && <Detail>Det er {relevant.length} tilbakemeldinger å sjekke!</Detail>}
            {relevant.length === 0 ? (
                <div className="w-full flex flex-col items-center justify-center min-h-96">
                    <Image src={zaraImages.happy.src} width={256} height={256} alt="Zara!" />
                    <Heading level="3" size="medium" spacing className="font-normal text-4xl mt-4">
                        Alle tilbakemeldinger OK!
                    </Heading>
                </div>
            ) : (
                <PrivacyMode feedback={relevant} />
            )}
        </PageBlock>
    )
}

export default Page
