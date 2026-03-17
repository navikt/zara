'use client'

import React, { ReactElement } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Detail, Heading } from '@navikt/ds-react'
import { useSelectedLayoutSegment } from 'next/dist/client/components/navigation'
import { ArrowLeftIcon } from '@navikt/aksel-icons'
import { AnimatePresence, motion } from 'motion/react'

import { zaraImages } from '@images/zaras'

function LinkHeader(): ReactElement {
    const selectedLayoutSegment = useSelectedLayoutSegment()
    const isRoot = selectedLayoutSegment == null

    return (
        <Link href="/" className="flex items-center gap-3">
            <Image src={zaraImages.normal.src} height="64" width={64} alt="Zara!" />
            <div>
                <AnimatePresence>
                    {!isRoot && (
                        <motion.div
                            initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                            animate={{ height: 'auto', opacity: 1, marginBottom: '-0.5rem' }}
                            exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                            transition={{
                                height: { type: 'spring', stiffness: 500, damping: 30 },
                                marginBottom: { type: 'spring', stiffness: 500, damping: 30 },
                                opacity: { duration: 0.2 },
                            }}
                            style={{ overflow: 'hidden' }}
                        >
                            <motion.div
                                initial={{ x: -12, filter: 'blur(4px)' }}
                                animate={{ x: 0, filter: 'blur(0px)' }}
                                exit={{ x: -12, filter: 'blur(4px)' }}
                                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                            >
                                <Detail className="flex items-center">
                                    <ArrowLeftIcon aria-hidden />
                                    Tilbake til start
                                </Detail>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <Heading size="large" level="1">
                    Team SYMFONI
                </Heading>
            </div>
        </Link>
    )
}

export default LinkHeader
