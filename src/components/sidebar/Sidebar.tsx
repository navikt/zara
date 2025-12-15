import { BandageIcon } from '@navikt/aksel-icons'
import Link from 'next/link'
import type { ReactElement } from 'react'

import SidebarMenuItem from './SidebarMenuItem'

type Props = {
    className?: string
}

function Sidebar({ className }: Props): ReactElement {
    return (
        <div className={className}>
            <SidebarMenuItem title="Sykmelding" Icon={BandageIcon}>
                <li>
                    <Link href="/sykmelding/oppslag">Slå opp en Sykmelding</Link>
                </li>
            </SidebarMenuItem>
        </div>
    )
}

export default Sidebar
