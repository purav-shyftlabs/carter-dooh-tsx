import { CircularProgress } from '@/lib/material-ui';
import styles from '../styles/components/notification-count.module.scss';

interface INotificationCount {
  isLoading: boolean;
  count: number | string;
}

const NotificationCount: React.FC<INotificationCount> = props => {
  const { isLoading, count } = props;
  if (isLoading) {
    return <CircularProgress size="18px" />;
  }
  if (Number(count) > 0) {
    return <div className={styles.approvalCount}>{`${count.toString().padStart(2, '0')}`}</div>;
  }
  return null;
};

export default NotificationCount;
