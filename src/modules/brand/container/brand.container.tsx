import React, { useState } from "react";
import InternalLayout from "@/layouts/internal-layout";
import PageHeader from "@/components/page-header/page-header.component";
import { Button } from "shyftlabs-dsl";
import { PlusIcon, AppWindow, PanelLeft as PanelLeftIcon } from "@/lib/icons";
import { useRouter } from "next/router";
import ROUTES from "@/common/routes";
import styles from "@/modules/users/styles/users.module.scss";
import { CarterTabs } from "shyftlabs-dsl";
import useTabChangeHelper from "@/common/hooks/tab-change.hook";
import { useAppSelector } from "@/redux/hooks";
import useUser from "@/contexts/user-data/user-data.hook";
import { AccessLevel, PermissionType } from "@/types";
import BrandListing from "@/modules/brand/components/brand-listing.component";
import { CarterTabType } from "shyftlabs-dsl";
import { checkAclFromState } from "@/common/acl";

// Brand page info
const BrandPageInfo = {
  title: 'Brands',
  actionButton: 'New Brand',
  all: {
    label: 'All',
    tab: 'all'
  },
  archived: {
    label: 'Archived',
    tab: 'archived'
  }
};

// Allow data-testid for testing without affecting library types
type CarterTabWithTestId = CarterTabType & { 'data-testid'?: string };

const Brand = () => {
    const router = useRouter();
    const { permission, isLoading } = useUser();
    const { currentTab, handleTabChange } = useTabChangeHelper();
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    
    const tabs: CarterTabWithTestId[] = [
        {
          title: BrandPageInfo.all.label,
          component: (props: Record<string, unknown>) => <BrandListing {...props} userType="all" viewMode={viewMode} />,
          additionalData: {
            userType: 'all',
          },
          'data-testid': 'brand-all-tab',
        },
        {
          title: BrandPageInfo.archived.label,
          component: (props: Record<string, unknown>) => <BrandListing {...props} userType="archived" viewMode={viewMode} />,
          additionalData: {
            userType: 'archived',
          },
          'data-testid': 'brand-archived-tab',
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
  return <>
      <PageHeader
        title={BrandPageInfo.title}
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
                label={BrandPageInfo.actionButton}
                iconPosition="left"
                size="small"
                icon={<PlusIcon />}
                onClick={() => {
                  router.push({
                    pathname: ROUTES.BRAND.ADD,
                    query: {
                      pageType: BrandPageInfo.all.tab,
                    },
                  });
                }}
              />
            ) : null}
          </div>
        )}
      />
      {!isLoading && (
        <div className={styles.container}>
          <CarterTabs 
            tabs={tabs} 
            noPadding 
            variant="off-white" 
            activeTab={currentTab} 
            onChange={handleTabChange}
          />
        </div>
      )}
  </>;
};
Brand.getLayout = (page: React.ReactNode) => <InternalLayout head={{ title: 'Brand', description: 'Brand' }}>{page}</InternalLayout>;
export default Brand;