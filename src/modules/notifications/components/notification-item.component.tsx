import { Notification } from 'types';
import { useMemo, useState } from 'react';
import useDateParser from '@/common/hooks/data-parser.hook';
import { DATE_FORMAT } from '@/common/constants';
import NotificationService from '@/services/notification/notification.service';
import styles from '../styles/notification-item.module.scss';
import NotificationText from './notification-text.component';
import { NotificationSkeletonItem } from './notification-skeleton.component';

interface INotificationItem {
  notification: Notification;
  markNotificationAsRead: (notificationId: string) => void;
  showDateTime?: boolean;
}

const NotificationItem: React.FC<INotificationItem> = props => {
  const { notification, markNotificationAsRead, showDateTime } = props;
  const { id, createdAt, notificationType, currentUserStatus } = notification;
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const notificationService = useMemo(() => new NotificationService(), []);
  const { getParsedDate } = useDateParser();

  const clickHandler = async () => {
    if (!currentUserStatus) {
      setIsUpdating(true);
      const payload = {
        notificationIds: [id],
        notificationType,
        status: true,
      };
      await notificationService
        .updateNotifications(payload, { silent: true })
        .then(() => {
          markNotificationAsRead(id);
        })
        .finally(() => {
          setIsUpdating(false);
        });
    }
  };

  if (isUpdating) {
    return <NotificationSkeletonItem />;
  }

  return (
    <button className={styles.container} onClick={clickHandler}>
      <div className={styles.read_status} data-unread={!currentUserStatus} />
      <p className={styles.time}>
        {showDateTime
          ? `${getParsedDate(createdAt, DATE_FORMAT.MMM_DD_YYYY)} ${getParsedDate(createdAt, DATE_FORMAT.HH_MM_A)}`
          : getParsedDate(createdAt, DATE_FORMAT.HH_MM_A)}
      </p>
      <div className={styles.content}>
        <NotificationText {...notification} />
      </div>
      <p className={styles.type}>{notificationType}</p>
    </button>
  );
};

export default NotificationItem;
