'use client'

import Image from 'next/image'
import React, { ComponentType, ReactElement } from 'react'

import RosIcon from '#images/cringe-cat-icon.png'

export function CringeCatIcon(): ReactElement {
    return <Image src={RosIcon} alt="" width={32} height={32} />
}

export type Iconable = ComponentType<{ fontSize?: string; 'aria-hidden'?: boolean }>
