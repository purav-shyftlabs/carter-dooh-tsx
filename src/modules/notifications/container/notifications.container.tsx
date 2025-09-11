import { Button, CarterTabs, CarterTabType } from 'shyftlabs-dsl';
import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { NotificationType } from 'types';
import PageHeader from '@/components/page-header/page-header.component';
import { CloseIcon } from '@/lib/icons';
import NotificationService from '@/services/notification/notification.service';
import { toggleNotificationDrawer } from '@/redux/actions';
import { AlertVariant } from '@/contexts/alert/alert.provider';
import useAlert from '@/contexts/alert/alert.hook';
import useUser from '@/contexts/user-data/user-data.hook';
import useNotificationCount from '@/contexts/notification/notification.hook';
import styles from '../styles/notifications.module.scss';
import NotificationList from '../components/notification-list.component';

const NotificationsContainer: React.FC = () => {
  const { showAlert } = useAlert();
  const { isAdvertiser } = useUser();
  const { refetchNotificationCount } = useNotificationCount();
  const notificationService = useMemo(() => new NotificationService(), []);

  const [notificationSet, setNotificationSet] = useState<Record<NotificationType, boolean>>();
  const [randomCount, setRandomCount] = useState<number>();
  const [activeTab, setActiveTab] = useState<string>('View All'.toLowerCase());

  const { mutate: getNotificationStatus } = useSWR(
    {
      key: 'notificationsStatus',
    },
    () => notificationService.getAllNotificationStatus({ silent: true }),
    {
      onSuccess: response => {
        const statusSet = response.data?.notificationStatusByType.statusByType?.reduce(
          (acc, item) => ({ ...acc, [item?.type as NotificationType]: item?.status }),
          {} as Record<NotificationType, boolean>,
        );
        setNotificationSet(statusSet);
      },
    },
  );

  const refetchNotificationStatus = () => {
    getNotificationStatus();
    refetchNotificationCount();
  };

  const handleMarkAllReadClick = (type: string) => {
    const payload = {
      notificationType: type,
      status: true,
    };
    notificationService.updateAll(payload, { silent: true }).then(() => {
      refetchNotificationStatus();
      showAlert('Notifications updated successfully', AlertVariant.SUCCESS);
      // Workaround to Fetch All child Notifications
      setRandomCount(prev => (prev || 0) + Math.random() * 100);
    });
  };

  const isSomeUnread = Object.values(notificationSet || {}).some(item => !item);

  let tabs: CarterTabType[] = [
    {
      title: 'View All',
      component: NotificationList,
      iconProps: {
        icon: isSomeUnread ? <div className={styles.circle_icon} /> : null,
      },
      additionalData: {
        type: null,
        refetchNotificationStatus,
        randomCount,
      },
    },
    {
      title: 'Campaign',
      component: NotificationList,
      iconProps: {
        icon: !notificationSet?.[NotificationType.Campaign] ? <div className={styles.circle_icon} /> : null,
      },
      additionalData: {
        type: NotificationType.Campaign,
        refetchNotificationStatus,
        randomCount,
      },
    },
    {
      title: 'Approval',
      component: NotificationList,
      iconProps: {
        icon: !notificationSet?.[NotificationType.Approval] ? <div className={styles.circle_icon} /> : null,
      },
      additionalData: {
        type: NotificationType.Approval,
        refetchNotificationStatus,
        randomCount,
      },
    },
    {
      title: 'Wallet',
      component: NotificationList,
      iconProps: {
        icon: !notificationSet?.[NotificationType.Wallet] ? <div className={styles.circle_icon} /> : null,
      },
      additionalData: {
        type: NotificationType.Wallet,
        refetchNotificationStatus,
        randomCount,
      },
    },
    {
      title: 'User',
      component: NotificationList,
      iconProps: {
        icon: !notificationSet?.[NotificationType.User] ? <div className={styles.circle_icon} /> : null,
      },
      additionalData: {
        type: NotificationType.User,
        refetchNotificationStatus,
        randomCount,
      },
    },
    {
      title: 'Advertiser',
      component: NotificationList,
      iconProps: {
        icon: !notificationSet?.[NotificationType.Advertiser] ? <div className={styles.circle_icon} /> : null,
      },
      additionalData: {
        type: NotificationType.Advertiser,
        refetchNotificationStatus,
        randomCount,
      },
    },
  ];

  tabs = isAdvertiser ? tabs.filter(item => !['Approval', 'Advertiser'].includes(item.title?.toString() || '')) : tabs;

  return (
    <div className={styles.container}>
      <PageHeader
        title={'Notification Center'}
        ActionComponent={() => (
          <Button
            variant="text-only"
            icon={<CloseIcon className={styles.close_icon} />}
            onClick={() => toggleNotificationDrawer(false)}
          />
        )}
      />
      <CarterTabs
        noPadding
        className={styles.tabs_container}
        tabs={tabs}
        variant="off-white"
        onChange={setActiveTab}
        activeTab={activeTab}
        ActionComponent={({ additionalData }) => (
          <Button
            label="Mark all as read"
            variant="tertiary"
            size="small"
            onClick={() => handleMarkAllReadClick(additionalData?.type)}
          />
        )}
      />
    </div>
  );
};

export default NotificationsContainer;
