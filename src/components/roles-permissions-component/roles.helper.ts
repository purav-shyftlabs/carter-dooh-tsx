import { AccessLevel, PermissionType } from '@/types';
import { USER_ROLE, USER_TYPE } from '@/common/constants';

export const DefaultPermForAdminBasic = {
  publisher: {
    standardUser: [
      { accessLevel: AccessLevel.VIEW_ACCESS, permissionType: PermissionType.AdInventoryPlacements },
      { accessLevel: AccessLevel.VIEW_ACCESS, permissionType: PermissionType.AudienceKeysValues },
      { accessLevel: AccessLevel.VIEW_ACCESS, permissionType: PermissionType.AllPublisherCampaigns },
      { accessLevel: AccessLevel.VIEW_ACCESS, permissionType: PermissionType.AllAdvertiserCampaigns },
      { accessLevel: AccessLevel.VIEW_ACCESS, permissionType: PermissionType.CreativeTemplate },
      { accessLevel: AccessLevel.CAMPAIGN_LEVEL, permissionType: PermissionType.ReportGeneration },
      { accessLevel: AccessLevel.VIEW_ACCESS, permissionType: PermissionType.AdvertiserManagement },
      { accessLevel: AccessLevel.NO_ACCESS, permissionType: PermissionType.AccountSetup },
      { accessLevel: AccessLevel.VIEW_ACCESS, permissionType: PermissionType.UserManagement },
      { accessLevel: AccessLevel.NO_ACCESS, permissionType: PermissionType.ApprovalRequests },
      { accessLevel: AccessLevel.VIEW_ACCESS, permissionType: PermissionType.Wallet },
      { accessLevel: AccessLevel.NO_ACCESS, permissionType: PermissionType.InsightDashboard },
      { accessLevel: AccessLevel.NO_ACCESS, permissionType: PermissionType.PublicApiAccess },
      { accessLevel: AccessLevel.NO_ACCESS, permissionType: PermissionType.YieldManagement },
      { accessLevel: AccessLevel.NO_ACCESS, permissionType: PermissionType.OffsiteIntegrations },
      { accessLevel: AccessLevel.NO_ACCESS, permissionType: PermissionType.OffsiteCampaigns },
    ],
    admin: [
      { accessLevel: AccessLevel.FULL_ACCESS, permissionType: PermissionType.AdInventoryPlacements },
      { accessLevel: AccessLevel.FULL_ACCESS, permissionType: PermissionType.AudienceKeysValues },
      { accessLevel: AccessLevel.FULL_ACCESS, permissionType: PermissionType.AllPublisherCampaigns },
      { accessLevel: AccessLevel.FULL_ACCESS, permissionType: PermissionType.AllAdvertiserCampaigns },
      { accessLevel: AccessLevel.FULL_ACCESS, permissionType: PermissionType.CreativeTemplate },
      { accessLevel: AccessLevel.FULL_ACCESS, permissionType: PermissionType.ReportGeneration },
      { accessLevel: AccessLevel.FULL_ACCESS, permissionType: PermissionType.AdvertiserManagement },
      { accessLevel: AccessLevel.FULL_ACCESS, permissionType: PermissionType.AccountSetup },
      { accessLevel: AccessLevel.FULL_ACCESS, permissionType: PermissionType.UserManagement },
      { accessLevel: AccessLevel.ALL_REQUESTS, permissionType: PermissionType.ApprovalRequests },
      { accessLevel: AccessLevel.MANAGE_WALLET, permissionType: PermissionType.Wallet },
      { accessLevel: AccessLevel.VIEW_ACCESS, permissionType: PermissionType.InsightDashboard },
      { accessLevel: AccessLevel.NO_ACCESS, permissionType: PermissionType.PublicApiAccess },
      { accessLevel: AccessLevel.FULL_ACCESS, permissionType: PermissionType.YieldManagement },
      { accessLevel: AccessLevel.NO_ACCESS, permissionType: PermissionType.OffsiteIntegrations },
      { accessLevel: AccessLevel.NO_ACCESS, permissionType: PermissionType.OffsiteCampaigns },
    ],
  },
  advertiser: {
    standardUser: [
      { accessLevel: AccessLevel.VIEW_ACCESS, permissionType: PermissionType.AllAdvertiserCampaigns },
      { accessLevel: AccessLevel.CAMPAIGN_LEVEL, permissionType: PermissionType.ReportGeneration },
      { accessLevel: AccessLevel.VIEW_ACCESS, permissionType: PermissionType.UserManagement },
      { accessLevel: AccessLevel.VIEW_ACCESS, permissionType: PermissionType.Wallet },
      { accessLevel: AccessLevel.NO_ACCESS, permissionType: PermissionType.InsightDashboard },
      { accessLevel: AccessLevel.NO_ACCESS, permissionType: PermissionType.PublicApiAccess },
      { accessLevel: AccessLevel.NO_ACCESS, permissionType: PermissionType.OffsiteCampaigns },
    ],
    admin: [
      { accessLevel: AccessLevel.FULL_ACCESS, permissionType: PermissionType.AllAdvertiserCampaigns },
      { accessLevel: AccessLevel.CAMPAIGN_LEVEL, permissionType: PermissionType.ReportGeneration },
      { accessLevel: AccessLevel.FULL_ACCESS, permissionType: PermissionType.UserManagement },
      { accessLevel: AccessLevel.MANAGE_WALLET, permissionType: PermissionType.Wallet },
      { accessLevel: AccessLevel.VIEW_ACCESS, permissionType: PermissionType.InsightDashboard },
      { accessLevel: AccessLevel.NO_ACCESS, permissionType: PermissionType.PublicApiAccess },
      { accessLevel: AccessLevel.NO_ACCESS, permissionType: PermissionType.OffsiteCampaigns },
    ],
  },
};

export const getRoles = (user: any) => {
  if (user.userType === USER_TYPE.PUBLISHER) {
    if (user.roleType === USER_ROLE.SUPER_USER) {
      return DefaultPermForAdminBasic.publisher.admin;
    }
    return DefaultPermForAdminBasic.publisher.standardUser;
  }
  if (user.userType === USER_TYPE.ADVERTISER) {
    if (user.roleType === USER_ROLE.SUPER_USER) {
      return DefaultPermForAdminBasic.advertiser.admin;
    }
    return DefaultPermForAdminBasic.advertiser.standardUser;
  }
  return [];
};
