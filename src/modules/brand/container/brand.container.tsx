import InternalLayout from "@/layouts/internal-layout";
import PageHeader from "@/components/page-header/page-header.component";
import { Button } from "shyftlabs-dsl";
import { PlusIcon } from "@/lib/icons";
import { useRouter } from "next/router";
import ROUTES from "@/common/routes";
import styles from "@/modules/users/styles/users.module.scss";
import { CarterTabs } from "shyftlabs-dsl";
import useTabChangeHelper from "@/common/hooks/tab-change.hook";
import { useAppSelector } from "@/redux/hooks";
import useUser from "@/contexts/user-data/user-data.hook";
import { AccessLevel, PermissionType, UserType } from "@/types";
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
    
    const tabs: CarterTabWithTestId[] = [
        {
          title: BrandPageInfo.all.label,
          component: BrandListing,
          additionalData: {
            userType: 'all',
          },
          'data-testid': 'brand-all-tab',
        },
        {
          title: BrandPageInfo.archived.label,
          component: BrandListing,
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
        ActionComponent={() =>
          hasFullAccess ? (
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
          ) : null
        }
      />
      {!isLoading && (
        <div className={styles.container}>
          <CarterTabs tabs={tabs} noPadding variant="off-white" activeTab={currentTab} onChange={handleTabChange} />
        </div>
      )}
  </>;
};
Brand.getLayout = (page: React.ReactNode) => <InternalLayout head={{ title: 'Brand', description: 'Brand' }}>{page}</InternalLayout>;
export default Brand;