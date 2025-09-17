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
import { CarterTabType } from "shyftlabs-dsl";
import { checkAclFromState } from "@/common/acl";
import ContentListing from "../components/content-listing.component";

// Brand page info
const ContentPageInfo = {
  title: 'Content',
  actionButton: 'New Content',
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

const Content = () => {
    const router = useRouter();
    const { permission, isLoading } = useUser();
    const { currentTab, handleTabChange } = useTabChangeHelper();
    
    const tabs: CarterTabWithTestId[] = [
        {
          title: ContentPageInfo.all.label,
          component: ContentListing,
          additionalData: {
            userType: 'all',
          },
          'data-testid': 'content-all-tab',
        },
        {
          title: ContentPageInfo.archived.label,
          component: ContentListing,
          additionalData: {
            userType: 'archived',
          },
          'data-testid': 'content-archived-tab',
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
        title={ContentPageInfo.title}
        ActionComponent={() =>
          hasFullAccess ? (
            <Button
              label={ContentPageInfo.actionButton}
              iconPosition="left"
              size="small"
              icon={<PlusIcon />}
              onClick={() => {
                router.push({
                  pathname: ROUTES.CONTENT.ADD,
                  query: {
                    pageType: ContentPageInfo.all.tab,
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
Content.getLayout = (page: React.ReactNode) => <InternalLayout head={{ title: 'Content', description: 'Content' }}>{page}</InternalLayout>;
export default Content;