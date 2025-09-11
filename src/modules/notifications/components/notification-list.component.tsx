import { Maybe, NotificationType } from 'types';
import useAccount from '@/contexts/account/account-data.hook';
import { getNotificationDatesArray } from '../helper/notification-helper';
import styles from '../styles/notification-group.module.scss';
import NotificationGroup from './notification-group.component';
interface INotificationList {
  type?: Maybe<NotificationType>;
  randomCount?: number;
  refetchNotificationStatus?: () => void;
}

const NotificationList: React.FC<INotificationList> = props => {
  const { type, randomCount, refetchNotificationStatus } = props;
  const { timeZone, account } = useAccount();
  const notificationDates = getNotificationDatesArray(timeZone, account?.createdAt);

  return (
    <div className={styles.list_container}>
      {notificationDates.map(item => (
        <NotificationGroup
          key={`${type || 'all'}-${item.fromDate.toISOString()}`}
          notificationType={type}
          randomCount={randomCount}
          refetchNotificationStatus={refetchNotificationStatus}
          {...item}
        />
      ))}
    </div>
  );
};

export default NotificationList;
