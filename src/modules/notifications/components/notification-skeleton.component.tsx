import { Skeleton } from '@/lib/material-ui';
import styles from '../styles/notification-skeleton.module.scss';

export const NotificationSkeletonItem = () => {
  return (
    <div className={styles.container}>
      <Skeleton width={6} height={6} variant="circular" className={styles.read_icon} />
      <Skeleton width={'3.5%'} />
      <Skeleton width={'100%'} />
      <Skeleton width={'6.5%'} />
    </div>
  );
};

const NotificationSkeleton = () => {
  return (
    <>
      {new Array(10).fill('notification').map((item, index) => (
        <NotificationSkeletonItem key={`${item}_${index}`} />
      ))}
    </>
  );
};

export default NotificationSkeleton;
