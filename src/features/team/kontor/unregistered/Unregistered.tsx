import React, { ReactElement } from 'react'
import Image from 'next/image'
import { Heading } from '@navikt/ds-react'

import { zaraImages } from '@images/zaras'
import SelfRegisterButtons from '@features/team/kontor/unregistered/SelfRegisterButtons'

function Unregistered(): ReactElement {
    return (
        <div className="flex gap-6 items-center ">
            <div>
                <Image src={zaraImages.happy.src} width={256} height={256} alt="Zara!" />
            </div>
            <div className="flex flex-col items-center justify-center">
                <Heading level="3" size="medium" spacing className="mb-8">
                    Hei! Du har ikke registrert deg i teamet enda
                </Heading>
                <SelfRegisterButtons />
            </div>
        </div>
    )
}

export default Unregistered
