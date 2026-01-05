import React, { useState } from "react";
import InternalLayout from "@/layouts/internal-layout";
import PageHeader from "@/components/page-header/page-header.component";
import { Button } from "shyftlabs-dsl";
import { PlusIcon, AppWindow, PanelLeft as PanelLeftIcon } from "@/lib/icons";
import { useRouter } from "next/router";
import ROUTES from "@/common/routes";
import styles from "@/modules/users/styles/users.module.scss";
import { CarterTabs } from "shyftlabs-dsl";
import { useAppSelector } from "@/redux/hooks";
import useUser from "@/contexts/user-data/user-data.hook";
import { AccessLevel, PermissionType } from "@/types";
import { checkAclFromState } from "@/common/acl";
import LayoutListing from "../components/layout-listing.component";

// Brand page info
const LayoutPageInfo = {
  title: 'Layouts',
  actionButton: 'New Layout',
  all: {
    label: 'All',
    tab: 'all'
  },
};

const Layout = () => {
    const router = useRouter();
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    
      
      const hasFullAccess = true;
  return (
    <>
      <PageHeader
        title={LayoutPageInfo.title}
        ActionComponent={() => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className={styles.button_group_container}>
              <Button
                size="small"
                variant={viewMode === 'table' ? 'primary' : 'tertiary'}
                icon={<PanelLeftIcon />}
                onClick={() => setViewMode('table')}
                label="Table"
                iconPosition="left"
              />
              <Button
                size="small"
                variant={viewMode === 'grid' ? 'primary' : 'tertiary'}
                icon={<AppWindow />}
                onClick={() => setViewMode('grid')}
                label="Grid"
                iconPosition="left"
              />
            </div>
            {hasFullAccess ? (
              <Button
                label={LayoutPageInfo.actionButton}
                iconPosition="left"
                size="small"
                icon={<PlusIcon />}
                onClick={() => {
                  router.push({
                    pathname: ROUTES.LAYOUTS.ADD,
                  });
                }}
              />
            ) : null}
          </div>
        )}
      />
      <div style={{ padding: '24px' }}>
        <LayoutListing />
      </div>
    </>
  );
};
Layout.getLayout = (page: React.ReactNode) => <InternalLayout head={{ title: 'Layouts', description: 'Layouts' }}>{page}</InternalLayout>;
export default Layout;