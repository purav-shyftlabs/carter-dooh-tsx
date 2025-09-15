import React from 'react';
import { useRouter } from 'next/router';
import { UserType } from '@/types';
import { Button, CarterTabs, CarterTabType } from 'shyftlabs-dsl';
import InternalLayout from '@/layouts/internal-layout/internal-layout';
import { PlusIcon } from '@/lib/icons';
import useUser from '@/contexts/user-data/user-data.hook';
import ROUTES from '@/common/routes';
import { NextPageWithLayout } from '@/types/common';
import PageHeader from '@/components/page-header/page-header.component';
import useTabChangeHelper from '../../../common/hooks/tab-change.hook';
import styles from '../styles/users.module.scss';
import UserListing from '../components/user-listing.component';
import { UsersPageInfo } from '../helper/users.common';

// Allow data-testid for testing without affecting library types
type CarterTabWithTestId = CarterTabType & { 'data-testid'?: string };

const Users: NextPageWithLayout = () => {
  const router = useRouter();
  const { currentTab, handleTabChange } = useTabChangeHelper();
  const { permission, isLoading, isPublisher } = useUser();

  const tabs: CarterTabWithTestId[] = [
    {
      title: UsersPageInfo.advertiser.label,
      component: UserListing,
      additionalData: {
        userType: UserType.Advertiser,
      },
      'data-testid': 'user-advertiser-tab',
    },
  ];
  if (isPublisher) {
    tabs.unshift({
      title: UsersPageInfo.publisher.label,
      component: UserListing,
      additionalData: {
        userType: UserType.Publisher,
      },
    });
  }

  const hasFullAccess = permission?.USER_MANAGEMENT?.fullAccess;

  return (
    <>
      <PageHeader
        title={UsersPageInfo.title}
        ActionComponent={() =>
          hasFullAccess ? (
            <Button
              label={UsersPageInfo.actionButton}
              iconPosition="left"
              size="small"
              icon={<PlusIcon />}
              onClick={() => {
                router.push({
                  pathname: ROUTES.USERS.ADD,
                  query: {
                    pageType:
                      isPublisher && currentTab !== UsersPageInfo.advertiser.tab
                        ? UsersPageInfo.publisher.tab
                        : UsersPageInfo.advertiser.tab,
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
    </>
  );
};

Users.getLayout = page => {
  return (
    <InternalLayout
      head={{
        title: UsersPageInfo.title,
      }}
    >
      {page}
    </InternalLayout>
  );
};

export default Users;
