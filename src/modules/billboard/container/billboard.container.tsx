import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Button, CarterTabs, CarterTabType } from 'shyftlabs-dsl';
import InternalLayout from '@/layouts/internal-layout/internal-layout';
import { PlusIcon, PanelLeft as PanelLeftIcon, AppWindow } from '@/lib/icons';
import useUser from '@/contexts/user-data/user-data.hook';
import { useAppSelector } from '@/redux/hooks';
import { checkAclFromState } from '@/common/acl';
import ROUTES from '@/common/routes';
import { NextPageWithLayout } from '@/types/common';
import PageHeader from '@/components/page-header/page-header.component';
import useTabChangeHelper from '@/common/hooks/tab-change.hook';
import styles from '../styles/billboard.module.scss';
import ScreensListing from '../components/screens-listing.component';
import { AccessLevel, PermissionType } from '@/types';

// Allow data-testid for testing without affecting library types
type CarterTabWithTestId = CarterTabType & { 'data-testid'?: string };

const BillboardPageInfo = {
  title: 'Screens',
  actionButton: 'Add Screen',
  all: {
    label: 'All Screens',
    tab: 'all',
  },
  online: {
    label: 'Online',
    tab: 'online',
  },
  offline: {
    label: 'Offline',
    tab: 'offline',
  },
};

const Billboard: NextPageWithLayout = () => {
  const router = useRouter();
  const { currentTab, handleTabChange } = useTabChangeHelper();
  const { permission, isLoading } = useUser();
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const tabs: CarterTabWithTestId[] = [
    {
      title: BillboardPageInfo.all.label,
      component: (_props: unknown) => <ScreensListing onlineFilter={undefined} viewMode={viewMode} />,
      additionalData: {
        screenType: 'all',
      },
      'data-testid': 'screens-all-tab',
    },
    {
      title: BillboardPageInfo.online.label,
      component: (_props: unknown) => <ScreensListing onlineFilter={true} viewMode={viewMode} />,
      additionalData: {
        screenType: 'online',
      },
      'data-testid': 'screens-online-tab',
    },
    {
      title: BillboardPageInfo.offline.label,
      component: (_props: unknown) => <ScreensListing onlineFilter={false} viewMode={viewMode} />,
      additionalData: {
        screenType: 'offline',
      },
      'data-testid': 'screens-offline-tab',
    },
  ];

  const hasFullAccessFromRedux = useAppSelector(state =>
    checkAclFromState(state, PermissionType.UserManagement, AccessLevel.FULL_ACCESS)
  );

  const flags = (permission as Record<string, unknown> | null | undefined)?.USER_MANAGEMENT as
    | Record<string, unknown>
    | null
    | undefined;
  const hasFullAccessFromFlags = Boolean(flags && (flags as { fullAccess?: boolean }).fullAccess);
  const hasFullAccess = Boolean(hasFullAccessFromRedux || hasFullAccessFromFlags);

  return (
    <>
      <PageHeader
        title={BillboardPageInfo.title}
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
            {isMounted && hasFullAccess ? (
              <Button
                label={BillboardPageInfo.actionButton}
                iconPosition="left"
                size="small"
                icon={<PlusIcon />}
                onClick={() => {
                  router.push(ROUTES.BILLBOARD.ADD);
                }}
              />
            ) : null}
          </div>
        )}
      />
      {!isLoading && (
        <div className={styles.container}>
          <CarterTabs tabs={tabs} noPadding variant="off-white" activeTab={currentTab} onChange={handleTabChange} />
        </div>
      )}
    </>
  );
};

Billboard.getLayout = page => {
  return (
    <InternalLayout
      head={{
        title: BillboardPageInfo.title,
        description: 'Manage your digital screens and billboards',
      }}
    >
      {page}
    </InternalLayout>
  );
};

export default Billboard;

