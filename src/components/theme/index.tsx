'use client'

import dynamic from 'next/dynamic'

export const ThemeChanger = dynamic(() => import('./Toggler').then((it) => it.ThemeToggler), {
    ssr: false,
})
