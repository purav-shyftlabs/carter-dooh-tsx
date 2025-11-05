import React, { useState } from "react";
import InternalLayout from "@/layouts/internal-layout";
import PageHeader from "@/components/page-header/page-header.component";
import { Button } from "shyftlabs-dsl";
import { AppWindow, PanelLeft as PanelLeftIcon, PlusIcon } from "@/lib/icons";
import { useRouter } from "next/router";
import styles from "@/modules/users/styles/users.module.scss";
import { CarterTabType } from "shyftlabs-dsl";
import AppListing from "../components/app-listing.component";

// Apps page info
const AppsPageInfo = {
  title: 'Apps',
  actionButton: 'New Integration'
};

// Allow data-testid for testing without affecting library types
type CarterTabWithTestId = CarterTabType & { 'data-testid'?: string };

const Apps = () => {
    const router = useRouter();
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  return <>
      <PageHeader
        title={AppsPageInfo.title}
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
            <Button
              label={AppsPageInfo.actionButton}
              iconPosition="left"
              size="small"
              icon={<PlusIcon />}
              onClick={() => {
                router.push('/apps/new');
              }}
            />
          </div>
        )}
      />

      <AppListing userType="all" viewMode={viewMode} />
     
  </>;
};
Apps.getLayout = (page: React.ReactNode) => <InternalLayout head={{ title: 'Apps', description: 'Apps' }}>{page}</InternalLayout>;
export default Apps;