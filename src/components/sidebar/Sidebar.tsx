import { BandageIcon } from "@navikt/aksel-icons";
import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";

import SidebarMenuItem from "./SidebarMenuItem.tsx";

type Props = {
  className?: string;
};

function Sidebar({ className }: Props): ReactElement {
  return (
    <div className={className}>
      <SidebarMenuItem title="Sykmelding" Icon={BandageIcon}>
        <li>
          <Link to="/sykmelding/oppslag">Slo opp en Sykmelding</Link>
        </li>
      </SidebarMenuItem>
    </div>
  );
}

export default Sidebar;
