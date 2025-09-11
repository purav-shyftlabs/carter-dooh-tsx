import { ActivityType, Notification } from 'types';
import { Button, Typography } from 'shyftlabs-dsl';
import { useRouter } from 'next/router';
import {
  getChangeObjectActivity,
  getChangeObjectActivityWithOldValue,
  isOOSActivity,
} from '@/modules/campaign-details/helper/activity-log.helper';
import { truncateString } from '@/common/helpers';
import ROUTES from '@/common/routes';
import { toggleNotificationDrawer } from '@/redux/actions';

import { useMediaQuery } from '@/lib/material-ui';
import styles from '../styles/notification-text.module.scss';
import { constructNotificationText, getNotificationRedirectUrl } from '../helper/notification-helper';

const NotificationText: React.FC<Notification> = notification => {
  const { activityType, changes = [], affectedEntity, ownerName } = notification;
  const isSmallScreen = useMediaQuery(`(min-width: 320px) and (max-width: 1024px)`);
  const router = useRouter();
  const notificationText = constructNotificationText(activityType, { changes });
  const redirectURL = getNotificationRedirectUrl(notification);

  const isRedirectable = affectedEntity?.id && affectedEntity?.name && !!redirectURL;

  const handleHyperLinkClick = () => {
    router.push(redirectURL);
    toggleNotificationDrawer(false);
  };

  const handleCampaignRedirectClick = (type: 'new' | 'source') => {
    let redirectTo = ROUTES.CAMPAIGN.BASE;
    if (type === 'new') {
      redirectTo += `/${affectedEntity?.id}`;
    } else {
      redirectTo += `/${getChangeObjectActivity(changes ?? []).sourceCampaignId}`;
    }
    router.push(redirectTo);
    toggleNotificationDrawer(false);
  };

  if (activityType === ActivityType.CopyCampaign) {
    return (
      <p className={styles.container}>
        <Typography key="start" lineHeight="20px">
          {notificationText.start}
        </Typography>
        <Button
          key="new-campaign"
          variant="text-only"
          className={styles.hyperlink_container}
          onClick={() => handleCampaignRedirectClick('new')}
          title={affectedEntity?.name || ''}
          label={truncateString(affectedEntity?.name || '', 20)}
        />
        <Typography key="mid" lineHeight="20px">
          {notificationText.mid}
        </Typography>
        <Button
          key="source-campaign"
          variant="text-only"
          className={styles.hyperlink_container}
          onClick={() => handleCampaignRedirectClick('source')}
          title={getChangeObjectActivityWithOldValue(changes ?? []).name?.oldValue || ''}
          label={truncateString(getChangeObjectActivityWithOldValue(changes ?? []).name?.oldValue || '', 20)}
        />
        <Typography key="by-text" lineHeight="20px">
          {' '}
          by{' '}
        </Typography>
        <Typography key="owner" variant="body-bold" lineHeight="20px">
          {ownerName}
        </Typography>
      </p>
    );
  }

  return (
    <p className={styles.container}>
      <Typography key="start" lineHeight="20px">
        {notificationText.start}
      </Typography>
      {isRedirectable ? (
        <Button
          key="hyperlink"
          variant="text-only"
          className={styles.hyperlink_container}
          onClick={handleHyperLinkClick}
          label={truncateString(affectedEntity?.name || '', isSmallScreen ? 15 : 25)}
          title={affectedEntity?.name || ''}
        />
      ) : (
        <Typography key="entity-name" trimLength={20} lineHeight="20px">
          {affectedEntity?.name || ''}
        </Typography>
      )}
      <Typography key="mid" lineHeight="20px">
        {notificationText.mid}
      </Typography>
      {!isOOSActivity({ changes, activityType } as any) && (
        <Typography key="owner" variant="body-bold">
          {' '}
          {ownerName}
        </Typography>
      )}
      <Typography key="end" trimLength={45} lineHeight="20px">
        {notificationText.end}
      </Typography>
    </p>
  );
};

export default NotificationText;
