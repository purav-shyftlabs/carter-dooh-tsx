import React, { useEffect, useState, useCallback } from 'react';
import { AccessLevel, PermissionType } from '@/types';
import { Typography } from 'shyftlabs-dsl';
import { Table, TableHead, TableRow, TableCell, TableBody, TableContainer } from '@/lib/material-ui';
import { PERMISSION_LEVELS, USER_ROLE, USER_TYPE } from '@/common/constants';
import useUser from '@/contexts/user-data/user-data.hook';
import { useAppSelector } from '@/redux/hooks';
import { checkAclFromState, canUserAssignPermission, getAccessLevelFromState } from '@/common/acl';
import { getStore } from '@/redux/store';
import useConfigs from '@/contexts/app-configs/app-configs.hooks';
import styles from './permissions.module.scss';
import CustomPermission from './custom-permission.component';

export type PERMISSIONS = {
  [key in PermissionType]?: PERMISSION_LEVELS;
};

// Function to map PERMISSION_LEVELS to AccessLevel
const getAccessLevelFromPermissionLevel = (permissionLevel: PERMISSION_LEVELS): AccessLevel | null => {
  switch (permissionLevel) {
    case PERMISSION_LEVELS.NO_ACCESS:
      return AccessLevel.NO_ACCESS;
    case PERMISSION_LEVELS.VIEW_ONLY:
    case PERMISSION_LEVELS.VIEW_ACCESS:
      return AccessLevel.VIEW_ACCESS;
    case PERMISSION_LEVELS.FULL_ACCESS:
    case PERMISSION_LEVELS.FULL_ACCESS_REPORT:
    case PERMISSION_LEVELS.FULL_ACCESS_PUBLIC_KEY:
      return AccessLevel.FULL_ACCESS;
    case PERMISSION_LEVELS.CAMPAIGN_LEVEL:
      return AccessLevel.CAMPAIGN_LEVEL;
    case PERMISSION_LEVELS.COMPREHENSIVE_ACCESS:
    case PERMISSION_LEVELS.ALL_LEVELS:
      return AccessLevel.COMPREHENSIVE_ACCESS;
    case PERMISSION_LEVELS.MANAGE_WALLET:
      return AccessLevel.MANAGE_WALLET;
    case PERMISSION_LEVELS.APPROVAL_ACCESS:
    case PERMISSION_LEVELS.ALL_REQUESTS:
      return AccessLevel.ALL_REQUESTS;
    case PERMISSION_LEVELS.CREATIVE_REQUESTS:
      return AccessLevel.CREATIVE_REQUESTS;
    default:
      return null;
  }
};

export const advertiser_permissions: PERMISSIONS = {
  [PermissionType.AllAdvertiserCampaigns]: PERMISSION_LEVELS.VIEW_ONLY,
  [PermissionType.ReportGeneration]: PERMISSION_LEVELS.CAMPAIGN_LEVEL,
  [PermissionType.UserManagement]: PERMISSION_LEVELS.VIEW_ONLY,
  [PermissionType.Wallet]: PERMISSION_LEVELS.NO_ACCESS,
  [PermissionType.InsightDashboard]: PERMISSION_LEVELS.NO_ACCESS,
  [PermissionType.PublicApiAccess]: PERMISSION_LEVELS.NO_ACCESS,
  [PermissionType.OffsiteCampaigns]: PERMISSION_LEVELS.NO_ACCESS,
};

export const publisher_permissions: PERMISSIONS = {
  [PermissionType.AdInventoryPlacements]: PERMISSION_LEVELS.VIEW_ONLY,
  [PermissionType.AudienceKeysValues]: PERMISSION_LEVELS.VIEW_ONLY,
  [PermissionType.AllPublisherCampaigns]: PERMISSION_LEVELS.VIEW_ONLY,
  [PermissionType.AllAdvertiserCampaigns]: PERMISSION_LEVELS.VIEW_ONLY,
  [PermissionType.CreativeTemplate]: PERMISSION_LEVELS.VIEW_ONLY,
  [PermissionType.ReportGeneration]: PERMISSION_LEVELS.CAMPAIGN_LEVEL,
  [PermissionType.AdvertiserManagement]: PERMISSION_LEVELS.VIEW_ONLY,
  [PermissionType.UserManagement]: PERMISSION_LEVELS.VIEW_ONLY,
  [PermissionType.AccountSetup]: PERMISSION_LEVELS.VIEW_ACCESS,
  [PermissionType.ApprovalRequests]: PERMISSION_LEVELS.NO_ACCESS,
  [PermissionType.Wallet]: PERMISSION_LEVELS.VIEW_ACCESS,
  [PermissionType.InsightDashboard]: PERMISSION_LEVELS.NO_ACCESS,
  [PermissionType.PublicApiAccess]: PERMISSION_LEVELS.NO_ACCESS,
  [PermissionType.YieldManagement]: PERMISSION_LEVELS.NO_ACCESS,
  [PermissionType.OffsiteIntegrations]: PERMISSION_LEVELS.NO_ACCESS,
  [PermissionType.OffsiteCampaigns]: PERMISSION_LEVELS.NO_ACCESS,
};

const RolesPermissionsComponent: React.FC<RolesPermissionsProps> = ({
  userType,
  defaultPermissions,
  defaultRole,
  onUpdatePermissions = () => {},
  onlyReadable = false,
  disabled,
}) => {
  const configs = useConfigs();
  const enableAPIExpose = configs?.enableAPIExpose;
  const showYieldManagementPermission = configs?.showYieldManagementPermission;
  const enableSocialCampaign = configs?.enableSocialCampaign;

  const initPermissions = useCallback((defaultPermissionsList: PERMISSIONS | undefined) => {
    let overridePermissions: Record<string, PERMISSION_LEVELS> = {};

    if (userType === USER_TYPE.PUBLISHER) {
      overridePermissions = { ...publisher_permissions };
    } else {
      overridePermissions = { ...advertiser_permissions };
    }

    if (defaultPermissionsList) {
      Object.keys(overridePermissions).forEach(key => {
        overridePermissions[key] = PERMISSION_LEVELS.NO_ACCESS;
      });
      overridePermissions = {
        ...overridePermissions,
        ...defaultPermissionsList,
      };
      Object.keys(overridePermissions).forEach(key => {
        if (!overridePermissions[key]) overridePermissions[key] = PERMISSION_LEVELS.NO_ACCESS;
      });
    }
    return overridePermissions;
  }, [userType]);

  const initRole = useCallback(() => {
    if (defaultRole) {
      return defaultRole;
    }
    return null;
  }, [defaultRole]);

  const { isAdvertiser, isLoading } = useUser();
  const hasOffsiteCampaignsNoAccess = useAppSelector(state =>
    checkAclFromState(state, PermissionType.OffsiteCampaigns, AccessLevel.NO_ACCESS)
  );
  const user = useAppSelector(state => state.auth.user);
  const showOperator = Boolean((user as { showOperator?: boolean })?.showOperator ?? true);
  const showAdmin = Boolean((user as { showAdmin?: boolean })?.showAdmin ?? true);
  const [permissions, setPermissions] = useState<Record<string, PERMISSION_LEVELS>>({});
  const [customPermissions, setCustomPermissions] = useState<Record<string, PERMISSION_LEVELS>>({});
  const [role, setRole] = useState<USER_ROLE | null>(initRole());

  // Helper function to check if current user can assign a specific permission level
  const canUserAssignPermissionLevel = (permissionType: PermissionType, targetPermissionLevel: PERMISSION_LEVELS): boolean => {
    const store = getStore();
    if (!store) return false;
    
    const state = store.getState();
    const userAccessLevel = getAccessLevelFromState(state, permissionType);
    const targetAccessLevel = getAccessLevelFromPermissionLevel(targetPermissionLevel);
    
    if (!userAccessLevel || !targetAccessLevel) {
      return false;
    }
    
    return canUserAssignPermission(permissionType, userAccessLevel, targetAccessLevel);
  };

  // Helper function to check if current user can edit a specific permission row
  const canUserEditPermissionRow = (permissionType: PermissionType): boolean => {
    const store = getStore();
    if (!store) return false;
    
    const state = store.getState();
    const userAccessLevel = getAccessLevelFromState(state, permissionType);
    return userAccessLevel !== null && userAccessLevel !== AccessLevel.NO_ACCESS;
  };

  // Helper function to check if current user has NO_ACCESS for a permission type (blocks entire row)
  const hasUserNoAccessToPermission = (permissionType: PermissionType): boolean => {
    const store = getStore();
    if (!store) return false;
    
    const state = store.getState();
    const userAccessLevel = getAccessLevelFromState(state, permissionType);
    return userAccessLevel === AccessLevel.NO_ACCESS;
  };

  // Helper function to get permission type from row content
  const getPermissionTypeFromContent = (content: string): PermissionType | null => {
    const contentToPermissionMap: Record<string, PermissionType> = {
      'User Management': PermissionType.UserManagement,
      'Account Settings': PermissionType.AccountSetup,
      'Public API Access': PermissionType.PublicApiAccess,
      'Offsite Integrations': PermissionType.OffsiteIntegrations,
      'Offsite Campaigns': PermissionType.OffsiteCampaigns,
      'All Advertiser\'s Campaigns': PermissionType.AllAdvertiserCampaigns,
      'All Publisher\'s Campaigns': PermissionType.AllPublisherCampaigns,
      'Report Generation': PermissionType.ReportGeneration,
      'Wallets': PermissionType.Wallet,
      'Insights Management': PermissionType.InsightDashboard,
      'Ad Inventory and Placements': PermissionType.AdInventoryPlacements,
      'Audience and Key/values': PermissionType.AudienceKeysValues,
      'Creative Templates': PermissionType.CreativeTemplate,
      'Advertisers Management': PermissionType.AdvertiserManagement,
      'Approval Requests': PermissionType.ApprovalRequests,
      'Yield Management': PermissionType.YieldManagement,
    };
    return contentToPermissionMap[content] || null;
  };

  const isYieldManagementEnabled = isAdvertiser
    ? showYieldManagementPermission?.showAdvertiser
    : showYieldManagementPermission?.showPublisher;

  useEffect(() => {
    const newRole = initRole();
    setRole(newRole);
  }, [defaultRole, initRole]);

  useEffect(() => {
    setPermissions(initPermissions(defaultPermissions));
    setCustomPermissions(initPermissions(defaultPermissions));
  }, [defaultPermissions, initPermissions]);

  const onCustomPermissionSelect = (option: PERMISSION_LEVELS, key: string) => {
    const per: Record<string, PERMISSION_LEVELS> = { ...permissions };
    per[key] = option;

    onUpdatePermissions(role as USER_ROLE, per);
  };

  const handlePermissionSelect = (key: PermissionType) => (permission: string) => {
    onCustomPermissionSelect(permission as PERMISSION_LEVELS, key);
  };

  const meta = {
    [USER_TYPE.PUBLISHER]: {
      columns: [
        {
          label: 'Operator',
          role: USER_ROLE.OPERATOR_USER,
        },
        {
          label: 'Admin',
          role: USER_ROLE.SUPER_USER,
        },
        {
          label: 'Custom',
          role: USER_ROLE.CUSTOM_USER,
        },
      ],
      rows: [
        // {
        //   c1: {
        //     role: 'none',
        //     content: 'Ad Inventory and Placements',
        //   },
        //   c2: {
        //     role: USER_ROLE.OPERATOR_USER,
        //     content: PERMISSION_LEVELS.VIEW_ONLY,
        //   },
        //   c3: {
        //     role: USER_ROLE.SUPER_USER,
        //     content: PERMISSION_LEVELS.FULL_ACCESS,
        //   },
        //   c4: {
        //     role: USER_ROLE.CUSTOM_USER,
        //     content: (
        //       <CustomPermission
        //         disabled={disabled}
        //         options={
        //           [
        //             PERMISSION_LEVELS.NO_ACCESS,
        //             PERMISSION_LEVELS.VIEW_ONLY,
        //             PERMISSION_LEVELS.FULL_ACCESS,
        //           ] as Array<string>
        //         }
        //         permissionKey={PermissionType.AdInventoryPlacements}
        //         onPermissionSelect={handlePermissionSelect(PermissionType.AdInventoryPlacements)}
        //         selectedPermission={permissions[PermissionType.AdInventoryPlacements] as PERMISSION_LEVELS}
        //       />
        //     ),
        //   },
        // },
        // {
        //   c1: {
        //     role: 'none',
        //     content: 'Audience and Key/values',
        //   },
        //   c2: {
        //     role: USER_ROLE.OPERATOR_USER,
        //     content: PERMISSION_LEVELS.VIEW_ONLY,
        //   },
        //   c3: {
        //     role: USER_ROLE.SUPER_USER,
        //     content: PERMISSION_LEVELS.FULL_ACCESS,
        //   },
        //   c4: {
        //     role: USER_ROLE.CUSTOM_USER,
        //     content: (
        //       <CustomPermission
        //         disabled={disabled}
        //         options={
        //           [
        //             PERMISSION_LEVELS.NO_ACCESS,
        //             PERMISSION_LEVELS.VIEW_ONLY,
        //             PERMISSION_LEVELS.FULL_ACCESS,
        //           ] as Array<string>
        //         }
        //         permissionKey={PermissionType.AudienceKeysValues}
        //         onPermissionSelect={handlePermissionSelect(PermissionType.AudienceKeysValues)}
        //         selectedPermission={permissions[PermissionType.AudienceKeysValues] as PERMISSION_LEVELS}
        //       />
        //     ),
        //   },
        // },
        // {
        //   c1: {
        //     role: 'none',
        //     content: 'All Publisher’s Campaigns',
        //   },
        //   c2: {
        //     role: USER_ROLE.OPERATOR_USER,
        //     content: PERMISSION_LEVELS.VIEW_ONLY,
        //   },
        //   c3: {
        //     role: USER_ROLE.SUPER_USER,
        //     content: PERMISSION_LEVELS.FULL_ACCESS,
        //   },
        //   c4: {
        //     role: USER_ROLE.CUSTOM_USER,
        //     content: (
        //       <CustomPermission
        //         disabled={disabled}
        //         options={
        //           [
        //             PERMISSION_LEVELS.NO_ACCESS,
        //             PERMISSION_LEVELS.VIEW_ONLY,
        //             PERMISSION_LEVELS.FULL_ACCESS,
        //           ] as Array<string>
        //         }
        //         permissionKey={PermissionType.AllPublisherCampaigns}
        //         onPermissionSelect={handlePermissionSelect(PermissionType.AllPublisherCampaigns)}
        //         selectedPermission={permissions[PermissionType.AllPublisherCampaigns] as PERMISSION_LEVELS}
        //       />
        //     ),
        //   },
        // },
        // {
        //   c1: {
        //     role: 'none',
        //     content: 'All Advertisers Campaigns',
        //   },
        //   c2: {
        //     role: USER_ROLE.OPERATOR_USER,
        //     content: PERMISSION_LEVELS.VIEW_ONLY,
        //   },
        //   c3: {
        //     role: USER_ROLE.SUPER_USER,
        //     content: PERMISSION_LEVELS.FULL_ACCESS,
        //   },
        //   c4: {
        //     role: USER_ROLE.CUSTOM_USER,
        //     content: (
        //       <CustomPermission
        //         disabled={disabled}
        //         options={
        //           [
        //             PERMISSION_LEVELS.NO_ACCESS,
        //             PERMISSION_LEVELS.VIEW_ONLY,
        //             PERMISSION_LEVELS.FULL_ACCESS,
        //           ] as Array<string>
        //         }
        //         permissionKey={PermissionType.AllAdvertiserCampaigns}
        //         onPermissionSelect={handlePermissionSelect(PermissionType.AllAdvertiserCampaigns)}
        //         selectedPermission={permissions[PermissionType.AllAdvertiserCampaigns] as PERMISSION_LEVELS}
        //       />
        //     ),
        //   },
        // },
        // {
        //   c1: {
        //     role: 'none',
        //     content: 'Creative Templates',
        //   },
        //   c2: {
        //     role: USER_ROLE.OPERATOR_USER,
        //     content: PERMISSION_LEVELS.VIEW_ONLY,
        //   },
        //   c3: {
        //     role: USER_ROLE.SUPER_USER,
        //     content: PERMISSION_LEVELS.FULL_ACCESS,
        //   },
        //   c4: {
        //     role: USER_ROLE.CUSTOM_USER,
        //     content: (
        //       <CustomPermission
        //         disabled={disabled}
        //         options={
        //           hasCreativeFullAccess &&
        //           permissions.ALL_PUBLISHER_CAMPAIGNS === PERMISSION_LEVELS.FULL_ACCESS &&
        //           permissions.ALL_ADVERTISER_CAMPAIGNS === PERMISSION_LEVELS.FULL_ACCESS
        //             ? ([
        //                 PERMISSION_LEVELS.NO_ACCESS,
        //                 PERMISSION_LEVELS.VIEW_ACCESS,
        //                 PERMISSION_LEVELS.FULL_ACCESS,
        //               ] as Array<string>)
        //             : ([PERMISSION_LEVELS.NO_ACCESS, PERMISSION_LEVELS.VIEW_ACCESS] as Array<string>)
        //         }
        //         permissionKey={PermissionType.CreativeTemplate}
        //         onPermissionSelect={handlePermissionSelect(PermissionType.CreativeTemplate)}
        //         selectedPermission={permissions[PermissionType.CreativeTemplate] as PERMISSION_LEVELS}
        //       />
        //     ),
        //   },
        // },
        // {
        //   c1: {
        //     role: 'none',
        //     content: 'Report Generation',
        //   },
        //   c2: {
        //     role: USER_ROLE.OPERATOR_USER,
        //     content: PERMISSION_LEVELS.CAMPAIGN_LEVEL,
        //   },
        //   c3: {
        //     role: USER_ROLE.SUPER_USER,
        //     content: PERMISSION_LEVELS.FULL_ACCESS_REPORT,
        //   },
        //   c4: {
        //     role: USER_ROLE.CUSTOM_USER,
        //     content: (
        //       <CustomPermission
        //         disabled={disabled}
        //         options={
        //           [
        //             PERMISSION_LEVELS.NO_ACCESS,
        //             PERMISSION_LEVELS.CAMPAIGN_LEVEL,
        //             PERMISSION_LEVELS.FULL_ACCESS_REPORT,
        //             PERMISSION_LEVELS.COMPREHENSIVE_ACCESS,
        //           ] as Array<string>
        //         }
        //         permissionKey={PermissionType.ReportGeneration}
        //         onPermissionSelect={handlePermissionSelect(PermissionType.ReportGeneration)}
        //         selectedPermission={permissions[PermissionType.ReportGeneration] as PERMISSION_LEVELS}
        //       />
        //     ),
        //   },
        // },
        // {
        //   c1: {
        //     role: 'none',
        //     content: 'Advertisers Management',
        //   },
        //   c2: {
        //     role: USER_ROLE.OPERATOR_USER,
        //     content: PERMISSION_LEVELS.VIEW_ONLY,
        //   },
        //   c3: {
        //     role: USER_ROLE.SUPER_USER,
        //     content: PERMISSION_LEVELS.FULL_ACCESS,
        //   },
        //   c4: {
        //     role: USER_ROLE.CUSTOM_USER,
        //     content: (
        //       <CustomPermission
        //         disabled={disabled}
        //         options={
        //           [
        //             PERMISSION_LEVELS.NO_ACCESS,
        //             PERMISSION_LEVELS.VIEW_ONLY,
        //             PERMISSION_LEVELS.FULL_ACCESS,
        //           ] as Array<string>
        //         }
        //         permissionKey={PermissionType.AdvertiserManagement}
        //         onPermissionSelect={handlePermissionSelect(PermissionType.AdvertiserManagement)}
        //         selectedPermission={permissions[PermissionType.AdvertiserManagement] as PERMISSION_LEVELS}
        //       />
        //     ),
        //   },
        // },
        {
          c1: {
            role: 'none',
            content: 'User Management',
          },
          c2: {
            role: USER_ROLE.OPERATOR_USER,
            content: PERMISSION_LEVELS.VIEW_ONLY,
          },
          c3: {
            role: USER_ROLE.SUPER_USER,
            content: PERMISSION_LEVELS.FULL_ACCESS,
          },
          c4: {
            role: USER_ROLE.CUSTOM_USER,
            content: (
              <CustomPermission
                disabled={disabled}
                options={
                  [
                    PERMISSION_LEVELS.NO_ACCESS,
                    PERMISSION_LEVELS.VIEW_ONLY,
                    PERMISSION_LEVELS.FULL_ACCESS,
                  ].filter(level => canUserAssignPermissionLevel(PermissionType.UserManagement, level as PERMISSION_LEVELS)) as Array<string>
                }
                permissionKey={PermissionType.UserManagement}
                onPermissionSelect={handlePermissionSelect(PermissionType.UserManagement)}
                selectedPermission={permissions[PermissionType.UserManagement] as PERMISSION_LEVELS}
              />
            ),
          },
        },
        // {
        //   c1: {
        //     role: 'none',
        //     content: 'Approval Requests',
        //   },
        //   c2: {
        //     role: USER_ROLE.OPERATOR_USER,
        //     content: PERMISSION_LEVELS.NO_ACCESS,
        //   },
        //   c3: {
        //     role: USER_ROLE.SUPER_USER,
        //     content: PERMISSION_LEVELS.ALL_REQUESTS,
        //   },
        //   c4: {
        //     role: USER_ROLE.CUSTOM_USER,
        //     content: (
        //       <CustomPermission
        //         disabled={disabled}
        //         options={
        //           [
        //             PERMISSION_LEVELS.NO_ACCESS,
        //             PERMISSION_LEVELS.ALL_REQUESTS,
        //             // PERMISSION_LEVELS.CREATIVE_REQUESTS,
        //           ] as Array<string>
        //         }
        //         permissionKey={PermissionType.ApprovalRequests}
        //         onPermissionSelect={handlePermissionSelect(PermissionType.ApprovalRequests)}
        //         selectedPermission={permissions[PermissionType.ApprovalRequests] as PERMISSION_LEVELS}
        //       />
        //     ),
        //   },
        // },
        // {
        //   c1: {
        //     role: 'none',
        //     content: 'Wallets',
        //   },
        //   c2: {
        //     role: USER_ROLE.OPERATOR_USER,
        //     content: PERMISSION_LEVELS.VIEW_ONLY,
        //   },
        //   c3: {
        //     role: USER_ROLE.SUPER_USER,
        //     content: PERMISSION_LEVELS.MANAGE_WALLET,
        //   },
        //   c4: {
        //     role: USER_ROLE.CUSTOM_USER,
        //     content: (
        //       <CustomPermission
        //         disabled={disabled}
        //         options={
        //           [
        //             PERMISSION_LEVELS.NO_ACCESS,
        //             PERMISSION_LEVELS.VIEW_ONLY,
        //             PERMISSION_LEVELS.MANAGE_WALLET,
        //             PERMISSION_LEVELS.APPROVAL_ACCESS,
        //           ] as Array<string>
        //         }
        //         permissionKey={PermissionType.Wallet}
        //         onPermissionSelect={handlePermissionSelect(PermissionType.Wallet)}
        //         selectedPermission={permissions[PermissionType.Wallet] as PERMISSION_LEVELS}
        //       />
        //     ),
        //   },
        // },
        // {
        //   c1: {
        //     role: 'none',
        //     content: 'Insights Management',
        //   },
        //   c2: {
        //     role: USER_ROLE.OPERATOR_USER,
        //     content: PERMISSION_LEVELS.NO_ACCESS,
        //   },
        //   c3: {
        //     role: USER_ROLE.SUPER_USER,
        //     content: PERMISSION_LEVELS.VIEW_ONLY,
        //   },
        //   c4: {
        //     role: USER_ROLE.CUSTOM_USER,
        //     content: (
        //       <CustomPermission
        //         disabled={disabled}
        //         options={[PERMISSION_LEVELS.NO_ACCESS, PERMISSION_LEVELS.VIEW_ONLY] as Array<string>}
        //         permissionKey={PermissionType.InsightDashboard}
        //         onPermissionSelect={handlePermissionSelect(PermissionType.InsightDashboard)}
        //         selectedPermission={permissions[PermissionType.InsightDashboard] as PERMISSION_LEVELS}
        //       />
        //     ),
        //   },
        // },
        {
          c1: {
            role: 'none',
            content: 'Account Settings',
          },
          c2: {
            role: USER_ROLE.OPERATOR_USER,
            content: PERMISSION_LEVELS.NO_ACCESS,
          },
          c3: {
            role: USER_ROLE.SUPER_USER,
            content: PERMISSION_LEVELS.FULL_ACCESS,
          },
          c4: {
            role: USER_ROLE.CUSTOM_USER,
            content: (
              <CustomPermission
                disabled={disabled}
                options={
                  [
                    PERMISSION_LEVELS.NO_ACCESS,
                    PERMISSION_LEVELS.VIEW_ONLY,
                    PERMISSION_LEVELS.FULL_ACCESS,
                  ].filter(level => canUserAssignPermissionLevel(PermissionType.AccountSetup, level as PERMISSION_LEVELS)) as Array<string>
                }
                permissionKey={PermissionType.AccountSetup}
                onPermissionSelect={handlePermissionSelect(PermissionType.AccountSetup)}
                selectedPermission={permissions[PermissionType.AccountSetup] as PERMISSION_LEVELS}
              />
            ),
          },
        },
        {
          c1: {
            role: 'none',
            content: 'Public API Access',
          },
          c2: {
            role: USER_ROLE.OPERATOR_USER,
            content: PERMISSION_LEVELS.NO_ACCESS,
          },
          c3: {
            role: USER_ROLE.SUPER_USER,
            content: PERMISSION_LEVELS.NO_ACCESS,
          },
          c4: {
            role: USER_ROLE.CUSTOM_USER,
            content: (
              <CustomPermission
                disabled={disabled}
                options={[PERMISSION_LEVELS.NO_ACCESS, PERMISSION_LEVELS.FULL_ACCESS_PUBLIC_KEY].filter(level => canUserAssignPermissionLevel(PermissionType.PublicApiAccess, level as PERMISSION_LEVELS)) as Array<string>}
                permissionKey={PermissionType.PublicApiAccess}
                onPermissionSelect={handlePermissionSelect(PermissionType.PublicApiAccess)}
                selectedPermission={permissions[PermissionType.PublicApiAccess] as PERMISSION_LEVELS}
              />
            ),
          },
        },
        // {
        //   c1: {
        //     role: 'none',
        //     content: 'Yield Management',
        //   },
        //   c2: {
        //     role: USER_ROLE.OPERATOR_USER,
        //     content: PERMISSION_LEVELS.NO_ACCESS,
        //   },
        //   c3: {
        //     role: USER_ROLE.SUPER_USER,
        //     content: PERMISSION_LEVELS.FULL_ACCESS,
        //   },
        //   c4: {
        //     role: USER_ROLE.CUSTOM_USER,
        //     content: (
        //       <CustomPermission
        //         disabled={disabled}
        //         options={
        //           [
        //             PERMISSION_LEVELS.NO_ACCESS,
        //             PERMISSION_LEVELS.VIEW_ONLY,
        //             PERMISSION_LEVELS.FULL_ACCESS,
        //           ] as Array<string>
        //         }
        //         permissionKey={PermissionType.YieldManagement}
        //         onPermissionSelect={handlePermissionSelect(PermissionType.YieldManagement)}
        //         selectedPermission={permissions[PermissionType.YieldManagement] as PERMISSION_LEVELS}
        //       />
        //     ),
        //   },
        // },
        {
          c1: {
            role: 'none',
            content: 'Offsite Integrations',
          },
          c2: {
            role: USER_ROLE.OPERATOR_USER,
            content: PERMISSION_LEVELS.NO_ACCESS,
          },
          c3: {
            role: USER_ROLE.SUPER_USER,
            content: PERMISSION_LEVELS.NO_ACCESS,
          },
          c4: {
            role: USER_ROLE.CUSTOM_USER,
            content: (
              <CustomPermission
                disabled={disabled}
                options={[PERMISSION_LEVELS.NO_ACCESS, PERMISSION_LEVELS.FULL_ACCESS].filter(level => canUserAssignPermissionLevel(PermissionType.OffsiteIntegrations, level as PERMISSION_LEVELS)) as Array<string>}
                permissionKey={PermissionType.OffsiteIntegrations}
                onPermissionSelect={handlePermissionSelect(PermissionType.OffsiteIntegrations)}
                selectedPermission={permissions[PermissionType.OffsiteIntegrations] as PERMISSION_LEVELS}
              />
            ),
          },
        },
        {
          c1: {
            role: 'none',
            content: 'Offsite Campaigns',
          },
          c2: {
            role: USER_ROLE.OPERATOR_USER,
            content: PERMISSION_LEVELS.NO_ACCESS,
          },
          c3: {
            role: USER_ROLE.SUPER_USER,
            content: PERMISSION_LEVELS.NO_ACCESS,
          },
          c4: {
            role: USER_ROLE.CUSTOM_USER,
            content: (
              <CustomPermission
                disabled={disabled}
                options={[PERMISSION_LEVELS.NO_ACCESS, PERMISSION_LEVELS.FULL_ACCESS].filter(level => canUserAssignPermissionLevel(PermissionType.OffsiteCampaigns, level as PERMISSION_LEVELS)) as Array<string>}
                permissionKey={PermissionType.OffsiteCampaigns}
                onPermissionSelect={handlePermissionSelect(PermissionType.OffsiteCampaigns)}
                selectedPermission={permissions[PermissionType.OffsiteCampaigns] as PERMISSION_LEVELS}
              />
            ),
          },
        },
      ],
    },
    [USER_TYPE.ADVERTISER]: {
      columns: [
        {
          label: 'Operator',
          role: USER_ROLE.OPERATOR_USER,
        },
        {
          label: 'Admin',
          role: USER_ROLE.SUPER_USER,
        },
        {
          label: 'Custom',
          role: USER_ROLE.CUSTOM_USER,
        },
      ],
      rows: [
        // {
        //   c1: {
        //     role: 'none',
        //     content: 'All Advertiser\'s Campaigns',
        //   },
        //   c2: {
        //     role: USER_ROLE.OPERATOR_USER,
        //     content: PERMISSION_LEVELS.VIEW_ONLY,
        //   },
        //   c3: {
        //     role: USER_ROLE.SUPER_USER,
        //     content: PERMISSION_LEVELS.FULL_ACCESS,
        //   },
        //   c4: {
        //     role: USER_ROLE.CUSTOM_USER,
        //     content: (
        //       <CustomPermission
        //         disabled={disabled}
        //         options={
        //           [
        //             PERMISSION_LEVELS.NO_ACCESS,
        //             PERMISSION_LEVELS.VIEW_ONLY,
        //             PERMISSION_LEVELS.FULL_ACCESS,
        //           ].filter(level => canUserAssignPermissionLevel(PermissionType.AllAdvertiserCampaigns, level as PERMISSION_LEVELS)) as Array<string>
        //         }
        //         permissionKey={PermissionType.AllAdvertiserCampaigns}
        //         onPermissionSelect={handlePermissionSelect(PermissionType.AllAdvertiserCampaigns)}
        //         selectedPermission={permissions[PermissionType.AllAdvertiserCampaigns] as PERMISSION_LEVELS}
        //       />
        //     ),
        //   },
        // },
        // {
        //   c1: {
        //     role: 'none',
        //     content: 'Report Generation',
        //   },
        //   c2: {
        //     role: USER_ROLE.OPERATOR_USER,
        //     content: PERMISSION_LEVELS.CAMPAIGN_LEVEL,
        //   },
        //   c3: {
        //     role: USER_ROLE.SUPER_USER,
        //     content: PERMISSION_LEVELS.CAMPAIGN_LEVEL,
        //   },
        //   c4: {
        //     role: USER_ROLE.CUSTOM_USER,
        //     content: (
        //       <CustomPermission
        //         disabled={disabled}
        //         options={[PERMISSION_LEVELS.NO_ACCESS, PERMISSION_LEVELS.CAMPAIGN_LEVEL].filter(level => canUserAssignPermissionLevel(PermissionType.ReportGeneration, level as PERMISSION_LEVELS)) as Array<string>}
        //         permissionKey={PermissionType.ReportGeneration}
        //         onPermissionSelect={handlePermissionSelect(PermissionType.ReportGeneration)}
        //         selectedPermission={
        //           role !== USER_ROLE.CUSTOM_USER && userType !== USER_TYPE.PUBLISHER
        //             ? (advertiser_permissions[PermissionType.ReportGeneration] as PERMISSION_LEVELS)
        //             : (permissions[PermissionType.ReportGeneration] as PERMISSION_LEVELS)
        //         }
        //       />
        //     ),
        //   },
        // },
        {
          c1: {
            role: 'none',
            content: 'User Management',
          },
          c2: {
            role: USER_ROLE.OPERATOR_USER,
            content: PERMISSION_LEVELS.VIEW_ONLY,
          },
          c3: {
            role: USER_ROLE.SUPER_USER,
            content: PERMISSION_LEVELS.FULL_ACCESS,
          },
          c4: {
            role: USER_ROLE.CUSTOM_USER,
            content: (
              <CustomPermission
                disabled={disabled}
                options={
                  [
                    PERMISSION_LEVELS.NO_ACCESS,
                    PERMISSION_LEVELS.VIEW_ONLY,
                    PERMISSION_LEVELS.FULL_ACCESS,
                  ].filter(level => canUserAssignPermissionLevel(PermissionType.UserManagement, level as PERMISSION_LEVELS)) as Array<string>
                }
                permissionKey={PermissionType.UserManagement}
                onPermissionSelect={handlePermissionSelect(PermissionType.UserManagement)}
                selectedPermission={permissions[PermissionType.UserManagement] as PERMISSION_LEVELS}
              />
            ),
          },
        },
        // {
        //   c1: {
        //     role: 'none',
        //     content: 'Wallets',
        //   },
        //   c2: {
        //     role: USER_ROLE.OPERATOR_USER,
        //     content: PERMISSION_LEVELS.VIEW_ONLY,
        //   },
        //   c3: {
        //     role: USER_ROLE.SUPER_USER,
        //     content: PERMISSION_LEVELS.MANAGE_WALLET,
        //   },
        //   c4: {
        //     role: USER_ROLE.CUSTOM_USER,
        //     content: (
        //       <CustomPermission
        //         disabled={disabled}
        //         options={
        //           [
        //             PERMISSION_LEVELS.NO_ACCESS,
        //             PERMISSION_LEVELS.VIEW_ONLY,
        //             PERMISSION_LEVELS.MANAGE_WALLET,
        //           ].filter(level => canUserAssignPermissionLevel(PermissionType.Wallet, level as PERMISSION_LEVELS)) as Array<string>
        //         }
        //         permissionKey={PermissionType.Wallet}
        //         onPermissionSelect={handlePermissionSelect(PermissionType.Wallet)}
        //         selectedPermission={permissions[PermissionType.Wallet] as PERMISSION_LEVELS}
        //       />
        //     ),
        //   },
        // },
        // {
        //   c1: {
        //     role: 'none',
        //     content: 'Insights Management',
        //   },
        //   c2: {
        //     role: USER_ROLE.OPERATOR_USER,
        //     content: PERMISSION_LEVELS.NO_ACCESS,
        //   },
        //   c3: {
        //     role: USER_ROLE.SUPER_USER,
        //     content: PERMISSION_LEVELS.VIEW_ONLY,
        //   },
        //   c4: {
        //     role: USER_ROLE.CUSTOM_USER,
        //     content: (
        //       <CustomPermission
        //         disabled={disabled}
        //         options={[PERMISSION_LEVELS.NO_ACCESS, PERMISSION_LEVELS.VIEW_ONLY].filter(level => canUserAssignPermissionLevel(PermissionType.InsightDashboard, level as PERMISSION_LEVELS)) as Array<string>}
        //         permissionKey={PermissionType.InsightDashboard}
        //         onPermissionSelect={handlePermissionSelect(PermissionType.InsightDashboard)}
        //         selectedPermission={permissions[PermissionType.InsightDashboard] as PERMISSION_LEVELS}
        //       />
        //     ),
        //   },
        // },
        {
          c1: {
            role: 'none',
            content: 'Public API Access',
          },
          c2: {
            role: USER_ROLE.OPERATOR_USER,
            content: PERMISSION_LEVELS.NO_ACCESS,
          },
          c3: {
            role: USER_ROLE.SUPER_USER,
            content: PERMISSION_LEVELS.NO_ACCESS,
          },
          c4: {
            role: USER_ROLE.CUSTOM_USER,
            content: (
              <CustomPermission
                disabled={disabled}
                options={[PERMISSION_LEVELS.NO_ACCESS, PERMISSION_LEVELS.FULL_ACCESS_REPORT].filter(level => canUserAssignPermissionLevel(PermissionType.PublicApiAccess, level as PERMISSION_LEVELS)) as Array<string>}
                permissionKey={PermissionType.PublicApiAccess}
                onPermissionSelect={handlePermissionSelect(PermissionType.PublicApiAccess)}
                selectedPermission={permissions[PermissionType.PublicApiAccess] as PERMISSION_LEVELS}
              />
            ),
          },
        },
        {
          c1: {
            role: 'none',
            content: 'Offsite Campaigns',
          },
          c2: {
            role: USER_ROLE.OPERATOR_USER,
            content: PERMISSION_LEVELS.NO_ACCESS,
          },
          c3: {
            role: USER_ROLE.SUPER_USER,
            content: PERMISSION_LEVELS.NO_ACCESS,
          },
          c4: {
            role: USER_ROLE.CUSTOM_USER,
            content: (
              <CustomPermission
                disabled={disabled}
                options={[PERMISSION_LEVELS.NO_ACCESS, PERMISSION_LEVELS.FULL_ACCESS].filter(level => canUserAssignPermissionLevel(PermissionType.OffsiteCampaigns, level as PERMISSION_LEVELS)) as Array<string>}
                permissionKey={PermissionType.OffsiteCampaigns}
                onPermissionSelect={handlePermissionSelect(PermissionType.OffsiteCampaigns)}
                selectedPermission={permissions[PermissionType.OffsiteCampaigns] as PERMISSION_LEVELS}
              />
            ),
          },
        },
      ],
    },
  };

  const readableMeta = {
    [USER_TYPE.PUBLISHER]: {
      columns: [
        {
          label: 'Access Levels',
          role: USER_ROLE.OPERATOR_USER,
        },
      ],
      rows: [
        // {
        //   c1: {
        //     role: 'none',
        //     content: 'Ad Inventory and Placements',
        //   },
        //   c2: {
        //     role: USER_ROLE.OPERATOR_USER,
        //     content: defaultPermissions?.AD_INVENTORY_PLACEMENTS,
        //   },
        // },
        // {
        //   c1: {
        //     role: 'none',
        //     content: 'Audience and Key/values',
        //   },
        //   c2: {
        //     role: USER_ROLE.OPERATOR_USER,
        //     content: defaultPermissions?.AUDIENCE_KEYS_VALUES,
        //   },
        // },
        // {
        //   c1: {
        //     role: 'none',
        //     content: 'All Publisher’s Campaigns',
        //   },
        //   c2: {
        //     role: USER_ROLE.OPERATOR_USER,
        //     content: defaultPermissions?.ALL_PUBLISHER_CAMPAIGNS,
        //   },
        // },
        // {
        //   c1: {
        //     role: 'none',
        //     content: 'All Advertiser’s Campaigns',
        //   },
        //   c2: {
        //     role: USER_ROLE.OPERATOR_USER,
        //     content: defaultPermissions?.ALL_ADVERTISER_CAMPAIGNS,
        //   },
        // },
        // {
        //   c1: {
        //     role: 'none',
        //     content: 'Creative Templates',
        //   },
        //   c2: {
        //     role: USER_ROLE.OPERATOR_USER,
        //     content: defaultPermissions?.CREATIVE_TEMPLATE,
        //   },
        // },
        // {
        //   c1: {
        //     role: 'none',
        //     content: 'Report Generation',
        //   },
        //   c2: {
        //     role: USER_ROLE.OPERATOR_USER,
        //     content: defaultPermissions?.REPORT_GENERATION,
        //   },
        // },
        // {
        //   c1: {
        //     role: 'none',
        //     content: 'Advertisers Management',
        //   },
        //   c2: {
        //     role: USER_ROLE.OPERATOR_USER,
        //     content: defaultPermissions?.ADVERTISER_MANAGEMENT,
        //   },
        // },
        {
          c1: {
            role: 'none',
            content: 'User Management',
          },
          c2: {
            role: USER_ROLE.OPERATOR_USER,
            content: defaultPermissions?.USER_MANAGEMENT,
          },
        },
        // {
        //   c1: {
        //     role: 'none',
        //     content: 'Approval Requests',
        //   },
        //   c2: {
        //     role: USER_ROLE.OPERATOR_USER,
        //     content: defaultPermissions?.APPROVAL_REQUESTS,
        //   },
        // },
        // {
        //   c1: {
        //     role: 'none',
        //     content: 'Wallets',
        //   },
        //   c2: {
        //     role: USER_ROLE.OPERATOR_USER,
        //     content: defaultPermissions?.WALLET,
        //   },
        // },
        // {
        //   c1: {
        //     role: 'none',
        //     content: 'Insights Management',
        //   },
        //   c2: {
        //     role: USER_ROLE.OPERATOR_USER,
        //     content: defaultPermissions?.INSIGHT_DASHBOARD,
        //   },
        // },
        {
          c1: {
            role: 'none',
            content: 'Account Settings',
          },
          c2: {
            role: USER_ROLE.OPERATOR_USER,
            content: defaultPermissions?.ACCOUNT_SETTINGS,
          },
        },
        // {
        //   c1: {
        //     role: 'none',
        //     content: 'Yield Management',
        //   },
        //   c2: {
        //     role: USER_ROLE.OPERATOR_USER,
        //     content: defaultPermissions?.YIELD_MANAGEMENT,
        //   },
        // },
        {
          c1: {
            role: 'none',
            content: 'Public API Access',
          },
          c2: {
            role: USER_ROLE.OPERATOR_USER,
            content: defaultPermissions?.PUBLIC_API_ACCESS,
          },
        },
        {
          c1: {
            role: 'none',
            content: 'Offsite Integrations',
          },
          c2: {
            role: USER_ROLE.OPERATOR_USER,
            content: defaultPermissions?.OFFSITE_INTEGRATIONS,
          },
        },
        {
          c1: {
            role: 'none',
            content: 'Offsite Campaigns',
          },
          c2: {
            role: USER_ROLE.OPERATOR_USER,
            content: defaultPermissions?.OFFSITE_CAMPAIGNS,
          },
        },
      ],
    },
    [USER_TYPE.ADVERTISER]: {
      columns: [
        {
          label: 'Access level',
          role: USER_ROLE.SUPER_USER,
        },
      ],
      rows: [
        // {
        //   c1: {
        //     role: 'none',
        //     content: 'All Advertiser’s Campaigns',
        //   },
        //   c2: {
        //     role: USER_ROLE.SUPER_USER,
        //     content: defaultPermissions?.ALL_ADVERTISER_CAMPAIGNS,
        //   },
        // },
        // {
        //   c1: {
        //     role: 'none',
        //     content: 'Report Generation',
        //   },
        //   c2: {
        //     role: USER_ROLE.SUPER_USER,
        //     content: defaultPermissions?.REPORT_GENERATION,
        //   },
        // },
        {
          c1: {
            role: 'none',
            content: 'User Management',
          },
          c2: {
            role: USER_ROLE.SUPER_USER,
            content: defaultPermissions?.USER_MANAGEMENT,
          },
        },
        // {
        //   c1: {
        //     role: 'none',
        //     content: 'Wallets',
        //   },
        //   c2: {
        //     role: USER_ROLE.SUPER_USER,
        //     content: defaultPermissions?.WALLET,
        //   },
        // },
        // {
        //   c1: {
        //     role: 'none',
        //     content: 'Insights Management',
        //   },
        //   c2: {
        //     role: USER_ROLE.SUPER_USER,
        //     content: defaultPermissions?.INSIGHT_DASHBOARD,
        //   },
        // },
        // {
        //   c1: {
        //     role: 'none',
        //     content: 'Yield Management',
        //   },
        //   c2: {
        //     role: USER_ROLE.SUPER_USER,
        //     content: defaultPermissions?.YIELD_MANAGEMENT,
        //   },
        // },
        // {
        //   c1: {
        //     role: 'none',
        //     content: 'Public API Access',
        //   },
        //   c2: {
        //     role: USER_ROLE.SUPER_USER,
        //     content: defaultPermissions?.PUBLIC_API_ACCESS,
        //   },
        // },
        // {
        //   c1: {
        //     role: 'none',
        //     content: 'Offsite Campaigns',
        //   },
        //   c2: {
        //     role: USER_ROLE.SUPER_USER,
        //     content: defaultPermissions?.OFFSITE_CAMPAIGNS,
        //   },
        // },
      ],
    },
  };

  const userTypeKey: USER_TYPE = userType === USER_TYPE.ADVERTISER ? USER_TYPE.ADVERTISER : USER_TYPE.PUBLISHER;
  const dataSource: typeof readableMeta | typeof meta = onlyReadable ? readableMeta : meta;

  // Filter out YieldManagement
  const filteredRows = dataSource[userTypeKey].rows.filter(row => {
    const featureName = row.c1.content;

    // Handle Yield Management feature
    const isYieldManagementFeature = featureName === 'Yield Management';
    if (isYieldManagementFeature && !isYieldManagementEnabled) {
      return false;
    }

    // Handle Public API Access feature
    const isPublicAPIFeature = featureName === 'Public API Access';
    if (isPublicAPIFeature && !enableAPIExpose) {
      return false;
    }

    // Handle Advertiser Social Campaigns feature
    const isAdvertiserSocialCampaignsFeature = featureName === 'Offsite Campaigns';
    if (
      isAdvertiserSocialCampaignsFeature &&
      (!enableSocialCampaign?.showAdvertiser || !enableSocialCampaign?.showPublisher)
    ) {
      return false;
    }

    // Handle Publisher Social Campaigns feature
    const isPublisherSocialCampaignsFeature = featureName === 'Offsite Integrations';
    if (isPublisherSocialCampaignsFeature && !enableSocialCampaign?.showPublisher) {
      return false;
    }

    return true;
  });

  dataSource[userTypeKey].rows = filteredRows;

  if (!(isAdvertiser ? enableAPIExpose?.showAdvertiser : enableAPIExpose?.showPublisher)) {
    const userTypeKey: USER_TYPE = userType === USER_TYPE.ADVERTISER ? USER_TYPE.ADVERTISER : USER_TYPE.PUBLISHER;
    const dataSource: typeof readableMeta | typeof meta = onlyReadable ? readableMeta : meta;
    dataSource[userTypeKey].rows = dataSource[userTypeKey].rows.filter(item => item.c1.content !== 'Public API Access');
  }

  const filterSocialCampaign = (shouldShow: boolean | undefined, hasNoAccess: boolean | undefined) => {
    if (!shouldShow || hasNoAccess) {
      const userTypeKey: USER_TYPE = userType === USER_TYPE.ADVERTISER ? USER_TYPE.ADVERTISER : USER_TYPE.PUBLISHER;
      const dataSource: typeof readableMeta | typeof meta = onlyReadable ? readableMeta : meta;
      dataSource[userTypeKey].rows = dataSource[userTypeKey].rows.filter(
        item => !['Offsite Integrations', 'Offsite Campaigns'].includes(item.c1.content),
      );
    }
  };

  filterSocialCampaign(
    isAdvertiser ? enableSocialCampaign?.showAdvertiser : enableSocialCampaign?.showPublisher,
    hasOffsiteCampaignsNoAccess,
  );

  filterSocialCampaign(
    !isAdvertiser ? enableSocialCampaign?.showPublisher : enableSocialCampaign?.showAdvertiser,
    hasOffsiteCampaignsNoAccess,
  );

  const onRoleChange = (userRole: USER_ROLE) => {
    setRole(userRole);
    const per: Record<string, PERMISSION_LEVELS> = {};
    Object.keys(userType === USER_TYPE.ADVERTISER ? advertiser_permissions : publisher_permissions).forEach(key => {
      const permission: Record<string, PERMISSION_LEVELS> = { ...customPermissions };
      per[key] = permission[key];
    });
    onUpdatePermissions(userRole, per);
  };

  if (isLoading) {
    return null;
  }

  const renderPermissionContent = (content: string | React.ReactNode | Record<string, boolean>) => {
    if (!content) return 'No Access';

    if (typeof content === 'string') {
      return content;
    }

    if (typeof content === 'object' && !React.isValidElement(content)) {
      const contentObj = content as Record<string, boolean>;
      if (contentObj.fullAccess) return 'Full Access';
      if (contentObj.fullAccessReport) return 'Full Access Report';
      if (contentObj.fullAccessPublicKey) return 'Full Access Public Key';
      if (contentObj.viewAccess) return 'View Only';
      if (contentObj.campaignLevel) return 'Campaign Level';
      if (contentObj.comprehensiveAccess) return 'Comprehensive Access';
      if (contentObj.manageWallet) return 'Manage Wallet';
      if (contentObj.approvalAccess) return 'Approval Access';
      if (contentObj.allRequests) return 'All Requests';
      if (contentObj.creativeRequests) return 'Creative Requests';
      if (contentObj.noAccess) return 'No Access';
    }

    if (React.isValidElement(content)) {
      return content;
    }

    return 'No Access';
  };

  return (
    <div className={styles.mainDiv}>
      <TableContainer className={styles.tableContainer}>
        <Table className={styles.permissionsTable}>
          <TableHead className={styles.tableHead}>
            <TableRow>
              <TableCell>User Roles</TableCell>
              {(onlyReadable ? readableMeta : meta)[userType.toLowerCase() as USER_TYPE]?.columns.map(
                (item: { role: USER_ROLE; label: string }) => {
                  const isOperatorColumn = item.role === USER_ROLE.OPERATOR_USER;
                  const isAdminColumn = item.role === USER_ROLE.SUPER_USER;
                  const isColumnDisabled = (isOperatorColumn && !showOperator) || (isAdminColumn && !showAdmin);
                  
                  return (
                    <TableCell
                      onClick={() => (disabled || isColumnDisabled ? undefined : onRoleChange(item.role))}
                      key={item.role}
                      className={`${styles.tableHeadCell} ${isColumnDisabled ? styles.disabledColumn : ''}`}
                      data-id={role === item.role}
                      data-disabled-column={isColumnDisabled}
                    >
                      <div
                        className={styles.role_info_wrapper}
                        onClick={() => (disabled || isColumnDisabled ? undefined : onRoleChange(item.role))}
                      >
                        <Typography
                          variant="body-semibold"
                          data-testid={
                            item.label == 'Custom'
                              ? 'user-custom-role-option'
                              : item.label == 'Admin'
                              ? 'user-admin-role-option'
                              : item.label == 'Operator'
                              ? 'user-operator-role-option'
                              : undefined
                          }
                        >
                          {item.label}
                        </Typography>
                        <Typography variant="body-regular">User will get permission to edit all content </Typography>
                      </div>
                    </TableCell>
                  );
                },
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {(onlyReadable ? readableMeta : meta)[userType.toLowerCase() as USER_TYPE]?.rows.map(
              (item: Record<string, { role: string; content: string | React.ReactNode }>, index: number) => {
                // Determine permission type for this feature row
                const permissionType = getPermissionTypeFromContent(typeof item.c1.content === 'string' ? item.c1.content : '');
                
                // Check if current user has NO_ACCESS to this permission (blocks entire row)
                const isRowBlocked = permissionType ? hasUserNoAccessToPermission(permissionType) : false;

                return (
                  <TableRow key={index} className={isRowBlocked ? styles.disabledRow : ''}>
                    {Object.keys(item).map(key => {
                      const isOperatorColumn = item[key].role === USER_ROLE.OPERATOR_USER;
                      const isAdminColumn = item[key].role === USER_ROLE.SUPER_USER;
                      const isColumnDisabled = (isOperatorColumn && !showOperator) || (isAdminColumn && !showAdmin);
                      const isPermissionBlocked = (isOperatorColumn || isAdminColumn) && permissionType
                        ? !canUserEditPermissionRow(permissionType)
                        : false;
                      const finalDisabled = isColumnDisabled || isPermissionBlocked || isRowBlocked;

                      return (
                        <TableCell
                          key={key}
                          className={`${styles.tableBodyCell} ${finalDisabled ? styles.disabledColumn : ''}`}
                          data-id={role === item[key].role}
                          data-first={item[key].role === 'none'}
                          data-disabled-column={finalDisabled}
                        >
                          <div className={styles.permission_info_wrapper} data-testid="user-access-permission">
                            {key === 'c1' ? item[key].content : renderPermissionContent(item[key].content)}
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              },
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};
export default RolesPermissionsComponent;

export interface RolePermission {
  key: number;
  module: string;
  operatorOption: string;
  adminOption: string;
  customOption: string;
}

export interface RolesPermissionsProps {
  onUpdatePermissions?: (role: USER_ROLE, permissions: PERMISSIONS) => void;
  userType: string;
  defaultPermissions?: PERMISSIONS;
  defaultRole?: USER_ROLE;
  onlyReadable?: boolean;
  disabled?: boolean;
}
