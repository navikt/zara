import { Heading } from "@navikt/ds-react";
import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { LoggedInUser } from "./logged-in-user/LoggedInUser.tsx";
import logo from "./logo.webp";

function Header(): ReactElement {
  return (
    <div className="p-4 border-b border-b-border-subtle flex justify-between h-20">
      <Link to="/" className="flex items-center gap-3">
        <img src={logo} height="64" width={64} alt="MacGyver!" />
        <Heading size="large" level="1" className="text-text-default">
          Zara - Team SYMFONI
        </Heading>
      </Link>
      <div>
        <LoggedInUser />
      </div>
    </div>
  );
}

export default Header;
