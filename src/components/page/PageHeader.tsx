'use client'

import React, { PropsWithChildren, ReactElement } from 'react'
import { Heading } from '@navikt/ds-react'
import { ArrowLeftIcon, Buildings3Icon } from '@navikt/aksel-icons'
import { AnimatePresence, motion } from 'motion/react'

import { AkselNextLink } from '@components/AkselNextLink'

type Props = {
    heading: string
    Icon: typeof Buildings3Icon
    backTo?: {
        href: string
        text: string
        parentHasBack?: boolean
    }
}

function PageHeader({ Icon, children, backTo, heading }: PropsWithChildren<Props>): ReactElement {
    return (
        <div className="mb-2">
            {backTo != null && (
                <AnimatePresence initial={!backTo.parentHasBack}>
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        style={{ overflow: 'hidden' }}
                    >
                        <AkselNextLink className="text-ax-text-neutral text-base" href={backTo.href}>
                            <ArrowLeftIcon aria-hidden />
                            Tilbake til {backTo.text}
                        </AkselNextLink>
                    </motion.div>
                </AnimatePresence>
            )}
            <div className="flex justify-between items-center">
                <Heading level="2" size="large" className="flex gap-1 items-center">
                    <Icon aria-hidden />
                    {heading}
                </Heading>
                {children}
            </div>
        </div>
    )
}

export default PageHeader
