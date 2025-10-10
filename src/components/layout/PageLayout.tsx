import { PropsWithChildren, ReactElement, ReactNode } from "react";
import { Page } from "@navikt/ds-react";

import Sidebar from "../sidebar/Sidebar.tsx";

import styles from "./PageLayout.module.css";

function PageLayout({ header, children }: PropsWithChildren<{
  header: ReactNode;
}>): ReactElement {
  return (
    <Page contentBlockPadding="none">
      {header}
      <div className={styles.content}>
        <Sidebar className="p-4 overflow-auto h-full border-r border-r-border-subtle" />
        <Page.Block gutters width="2xl" as="main" className="p-4 overflow-auto">
          {children}
        </Page.Block>
      </div>
    </Page>
  );
}

export default PageLayout;
