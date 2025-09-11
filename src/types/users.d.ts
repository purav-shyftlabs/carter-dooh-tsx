import { PermissionType, UserAdvanced } from 'types';
import { PERMISSION_LEVELS } from '@/common/constants';

export type CustomUser = UserAdvanced & {
  brands?: Array<string>;
};

export interface UserDropDownItem {
  label: string;
  value: Maybe<string>;
  id: string;
}

export interface UserListingPropTypes {
  users: Array<CustomUser>;
  userCount: number | null | undefined;
}

export interface UserPermissionType {
  ACCOUNT_SETUP: {
    viewAccess: boolean;
    fullAccess: boolean;
    noAccess: boolean;
  };
  ADVERTISER_MANAGEMENT: {
    viewAccess: boolean;
    fullAccess: boolean;
    noAccess: boolean;
  };
  AD_INVENTORY_PLACEMENTS: {
    viewAccess: boolean;
    fullAccess: boolean;
    noAccess: boolean;
  };
  ALL_ADVERTISER_CAMPAIGNS: {
    viewAccess: boolean;
    fullAccess: boolean;
    noAccess: boolean;
  };
  ALL_PUBLISHER_CAMPAIGNS: {
    viewAccess: boolean;
    fullAccess: boolean;
    noAccess: boolean;
  };
  APPROVAL_REQUESTS: {
    viewAccess: boolean;
    fullAccess: boolean;
    noAccess: boolean;
  };
  AUDIENCE_KEYS_VALUES: {
    viewAccess: boolean;
    fullAccess: boolean;
    noAccess: boolean;
  };
  CREATIVE_TEMPLATE: {
    viewAccess: boolean;
    fullAccess: boolean;
    noAccess: boolean;
  };
  REPORT_GENERATION: {
    viewAccess: boolean;
    fullAccess: boolean;
    campaignLevel: boolean;
    comprehensiveAccess: boolean;
    noAccess: boolean;
  };
  USER_MANAGEMENT: {
    viewAccess: boolean;
    fullAccess: boolean;
    noAccess: boolean;
  };
  WALLET: {
    fullAccess: boolean;
    manageWallet: boolean;
    viewAccess: boolean;
    noAccess: boolean;
  };
  INSIGHT_DASHBOARD: {
    viewAccess: boolean;
    noAccess: boolean;
  };
  PUBLIC_API_ACCESS: {
    fullAccess: boolean;
    noAccess: boolean;
  };
  YIELD: {
    fullAccess: boolean;
    viewAccess: boolean;
    noAccess: boolean;
  };
  OFFSITE_CAMPAIGNS: {
    fullAccess: boolean;
    noAccess: boolean;
  };
  OFFSITE_INTEGRATIONS: {
    fullAccess: boolean;
    noAccess: boolean;
  };
}

export interface CustomPermission {
  options: Array<string>;
  onPermissionSelect: Function;
  selectedPermission: PERMISSION_LEVELS;
  permissionKey: PermissionType;
  disabled?: boolean;
}
