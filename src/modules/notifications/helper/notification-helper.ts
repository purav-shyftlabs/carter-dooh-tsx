import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { ActivityType, Maybe, Notification, NotificationsQueryVariables } from 'types';
import NotificationService from '@/services/notification/notification.service';
import { getChangeObjectActivity, isOOSActivity } from '@/modules/campaign-details/helper/activity-log.helper';
import DateTimeParser, { DateTimeType } from '@/lib/date-time-parser';
import ROUTES from '@/common/routes';

export const constructNotificationText = (
  activityType: ActivityType,
  { changes }: { changes?: any[] | null } = { changes: [] },
) => {
  if (activityType === ActivityType.EditChangeRequest) {
    const { comment: commentText, warnings } = getChangeObjectActivity(changes ?? []);
    if (typeof warnings === 'string') {
      return {
        start: '',
        mid: `${warnings} from`,
      };
    }
    return {
      start: 'Change Request ',
      mid: `was processed by`,
      ...(commentText && { end: `with comment : ${commentText}` }),
    };
  }
  if (isOOSActivity({ activityType, changes } as any)) {
    const warningText = getChangeObjectActivity(changes as any[])?.warnings;
    let mid = warningText && typeof warningText === 'string' ? `, ${warningText}` : '';
    return {
      start: 'Creative',
      mid,
    };
  }
  switch (activityType) {
    case ActivityType.AddAdvertiser:
      return {
        start: 'Advertiser',
        mid: 'was added by',
      };
    case ActivityType.EditAdvertiser:
      return {
        start: 'Advertiser',
        mid: 'was edited by',
      };
    case ActivityType.AddUser:
      return {
        start: 'User',
        mid: 'was added by',
      };
    case ActivityType.EditUser:
      return {
        start: 'User',
        mid: 'was edited by',
      };
    case ActivityType.AddCampaign:
      return {
        start: 'Campaign',
        mid: 'was added by',
      };
    case ActivityType.EditCampaign:
      return {
        start: 'Campaign',
        mid: 'was edited by',
      };
    case ActivityType.CopyCampaign:
      return {
        start: 'New Campaign added ',
        mid: ' - copied from ',
      };
    case ActivityType.AddAdItem:
      return {
        start: 'Ad Item',
        mid: 'was added by',
      };
    case ActivityType.EditAdItem:
      return {
        start: 'Ad Item',
        mid: 'was edited by',
      };
    case ActivityType.AddCreative:
      return {
        start: 'Creative',
        mid: 'was added by',
      };
    case ActivityType.EditCreative:
      return {
        start: 'Creative',
        mid: 'was edited by',
      };
    case ActivityType.AddWallet:
      return {
        start: 'Wallet',
        mid: 'was added by',
      };
    case ActivityType.EditWallet:
      return {
        start: 'Wallet',
        mid: 'was edited by',
      };
    case ActivityType.EditWalletBalance:
      return {
        start: 'Wallet Balance of',
        mid: 'was updated by',
      };
    case ActivityType.EditWalletStatus:
      return {
        start: 'Wallet',
        mid: 'was archived by',
      };
    case ActivityType.AddChangeRequest:
      return {
        start: 'Change Request',
        mid: 'was added by',
      };
    case ActivityType.AddSharedWallet:
      return {
        start: 'Shared Wallet',
        mid: 'was created by',
      };
    case ActivityType.EditSharedWalletStatus:
      return {
        start: 'Shared Wallet',
        mid: 'was edited by',
      };
    default:
      return {
        start: '',
        mid: 'was added by',
      };
  }
};

export const getNotificationHeader = (item: Maybe<Notification>, prevItem?: Maybe<Notification>, timeZone?: string) => {
  if (timeZone) {
    const currentDate = DateTimeParser.tz(item?.createdAt, timeZone);
    const prevDate = DateTimeParser.tz(prevItem?.createdAt, timeZone);
    if (!prevItem?.createdAt || !prevDate.isSame(currentDate, 'day')) {
      return currentDate;
    }
    return undefined;
  }
  return undefined;
};

export const getNotificationRedirectUrl = (item: Notification) => {
  const { affectedEntity: metadata, activityType } = item;
  if (!metadata) {
    return '';
  }
  const isAdvertiserActivity = [ActivityType.AddAdvertiser, ActivityType.EditAdvertiser].includes(activityType);
  if (isAdvertiserActivity) {
    return `${ROUTES.ADVERTISERS.BASE}/${metadata.id}`;
  }
  const isWalletActivity = [
    ActivityType.AddWallet,
    ActivityType.EditWallet,
    ActivityType.EditWalletBalance,
    ActivityType.EditWalletStatus,
  ].includes(activityType);
  if (isWalletActivity) {
    return `${ROUTES.WALLET.BASE}/${metadata.id}`;
  }
  const isUserActivity = [ActivityType.AddUser, ActivityType.EditUser].includes(activityType);
  if (isUserActivity) {
    return `${ROUTES.USERS.EDIT}/${metadata.id}`;
  }
  const isCampaignActivity = [ActivityType.AddCampaign, ActivityType.EditCampaign, ActivityType.CopyCampaign].includes(
    activityType,
  );
  if (isCampaignActivity) {
    return `${ROUTES.CAMPAIGN.BASE}/${metadata.id}`;
  }
  const isAdItemActivity = [ActivityType.AddAdItem, ActivityType.EditAdItem].includes(activityType);
  if (isAdItemActivity) {
    return `${ROUTES.AD_ITEM.BASE}/${metadata.id}`;
  }
  const isCreativeActivity = [ActivityType.AddCreative, ActivityType.EditCreative].includes(activityType);
  if (isCreativeActivity) {
    const creativeMeta: any = metadata;
    return `${ROUTES.AD_ITEM.BASE}/${creativeMeta.adItemId}?creativeId=${creativeMeta.id}`;
  }
  const isChangeRequestActivity = [ActivityType.AddChangeRequest, ActivityType.EditChangeRequest].includes(
    activityType,
  );
  if (isChangeRequestActivity) {
    return `${ROUTES.APPROVAL_REQUEST.DETAILS}?requestId=${metadata.id}`;
  }
  return '';
};

const getNotificationDate = (day: DateTimeType, timeZone: string) => {
  const today = DateTimeParser.tz(timeZone);
  if (today.isSame(day, 'day')) {
    return 'Today';
  }
  if (today.clone().subtract(1, 'day').isSame(day, 'day')) {
    return 'Yesterday';
  }
  const dayDifference = today.diff(day, 'days');
  return `${dayDifference} days ago`;
};

export const useNotificationList = (options: Omit<NotificationsQueryVariables, 'page'>, config = {}) => {
  const PAGE_SIZE = 10;
  const [notificationFilters, setNotificationFilters] = useState<NotificationsQueryVariables>({
    page: 1,
    pageSize: PAGE_SIZE,
  });

  const notificationService = useMemo(() => new NotificationService(), []);

  const [notificationList, setNotificationList] = useState<Notification[]>([]);

  const goToPage = (page: number) => {
    setNotificationFilters(prev => ({
      ...prev,
      page,
    }));
  };

  const { data, isLoading, isValidating, mutate } = useSWR(
    {
      key: 'notificationList',
      filters: { ...notificationFilters, ...options },
      ...config,
    },
    payload => {
      return notificationService.getAllNotificationsByType(payload.filters, { silent: true });
    },
    {
      onSuccess: response => {
        const newList = response.data?.notifications.content || [];
        setNotificationList(newList as Notification[]);
      },
    },
  );

  const totalPage = Math.max(1, Math.ceil(Number(data?.data?.notifications.totalCount) / PAGE_SIZE));
  const pageNo = Number(notificationFilters.page);
  const hasNextPage = pageNo < totalPage;
  const hasPreviousPage = pageNo > 1;

  const markNotificationAsRead = (notificationId: string) => {
    setNotificationList(prev =>
      prev.map(item => ({ ...item, currentUserStatus: item.id === notificationId ? true : item.currentUserStatus })),
    );
  };

  return {
    isLoading: isLoading || isValidating,
    notificationList,
    pageNo,
    hasNextPage,
    hasPreviousPage,
    totalPage,
    goToPage,
    markNotificationAsRead,
    refetchNotifications: mutate,
  };
};

export const getNotificationDatesArray = (timeZone: string, createdAt?: string) => {
  const LAST_X_DAYS = 7;
  const dates = new Array(LAST_X_DAYS).fill(LAST_X_DAYS).map((_item, index) => ({
    fromDate: DateTimeParser.tz(timeZone).startOf('day').subtract(index, 'day'),
    toDate: DateTimeParser.tz(timeZone).endOf('day').subtract(index, 'day'),
    daysBefore: getNotificationDate(DateTimeParser.tz(timeZone).subtract(index, 'day'), timeZone),
    isOlderSection: false,
  }));
  if (createdAt) {
    dates.push({
      fromDate: DateTimeParser.tz(createdAt, timeZone).startOf('day'),
      toDate: DateTimeParser.tz(timeZone).endOf('day').subtract(LAST_X_DAYS, 'day'),
      daysBefore: 'Previous Notifications',
      isOlderSection: true,
    });
  }
  return dates;
};
