import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material';
import { useState } from 'react';
import { carterColors } from 'shyftlabs-dsl';
import { Maybe, NotificationType } from '@/types';
import { ChevronDownIcon } from '@/lib/icons';
import { DateTimeType } from '@/lib/date-time-parser';
import { DATE_FORMAT } from '@/common/constants';
import NoDataPlaceholder from '@/components/no-data-placeholder/no-data-placeholder.component';
import styles from '../styles/notification-group.module.scss';
import { useNotificationList } from '../helper/notification-helper';
import NotificationItem from './notification-item.component';
import NotificationSkeleton from './notification-skeleton.component';
import NotificationPagination from './notification-pagination.component';

interface INotificationGroup {
  fromDate: DateTimeType;
  toDate: DateTimeType;
  daysBefore: string;
  notificationType?: Maybe<NotificationType>;
  randomCount?: number;
  refetchNotificationStatus?: () => void;
  isOlderSection?: boolean;
}

const NotificationGroup: React.FC<INotificationGroup> = props => {
  const { fromDate, toDate, daysBefore, randomCount, notificationType, refetchNotificationStatus, isOlderSection } =
    props;
  const [isExpanded, setIsExpanded] = useState(true);
  const {
    isLoading,
    notificationList,
    pageNo,
    totalPage,
    hasNextPage,
    hasPreviousPage,
    markNotificationAsRead,
    goToPage,
  } = useNotificationList(
    {
      filters: { fromDate, toDate, notificationType },
    },
    { randomCount },
  );

  const handleNotificationRead = (notificationId: string) => {
    markNotificationAsRead(notificationId);
    if (refetchNotificationStatus) {
      refetchNotificationStatus();
    }
  };

  return (
    <Accordion
      disableGutters
      defaultExpanded
      className={styles.container}
      expanded={isExpanded}
      onChange={(_, expanded) => setIsExpanded(expanded)}
    >
      <AccordionSummary
        classes={{
          root: styles.accordion_header,
          content: styles.accordion_header_content,
        }}
        expandIcon={<ChevronDownIcon color={carterColors['brand-600']} />}
      >
        <span className={styles.date_string}>{daysBefore}</span>
        {!isOlderSection && <span className={styles.date_value}>{fromDate.format(DATE_FORMAT.MMM_DD_YYYY)}</span>}
      </AccordionSummary>
      <AccordionDetails
        classes={{
          root: styles.accordion_details,
        }}
      >
        {isLoading ? (
          <NotificationSkeleton />
        ) : !notificationList.length ? (
          <NoDataPlaceholder
            title="No Notification(s)"
            className={styles.no_notifications_container}
            description={`No notification received ${daysBefore}`}
          />
        ) : (
          <>
            {notificationList?.map(item => (
              <NotificationItem
                key={item.id}
                notification={item}
                markNotificationAsRead={handleNotificationRead}
                showDateTime={isOlderSection}
              />
            ))}
            {totalPage > 2 && (
              <NotificationPagination
                pageNo={pageNo}
                totalPage={totalPage}
                hasPrevPage={hasPreviousPage}
                hasNextPage={hasNextPage}
                goToPage={goToPage}
              />
            )}
          </>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

export default NotificationGroup;
