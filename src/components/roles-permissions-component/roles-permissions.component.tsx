import React, { useEffect, useState } from 'react';
import { AccessLevel, PermissionType } from '@/types';
import { Typography } from 'shyftlabs-dsl';
import { Table, TableHead, TableRow, TableCell, TableBody, TableContainer } from '@/lib/material-ui';
import { PERMISSION_LEVELS, USER_ROLE, USER_TYPE } from '@/common/constants';
import useUser from '@/contexts/user-data/user-data.hook';
import { useAppSelector } from '@/redux/hooks';
import { checkAclFromState } from '@/common/acl';
import useConfigs from '@/contexts/app-configs/app-configs.hooks';
import styles from './permissions.module.scss';
import CustomPermission from './custom-permission.component';

export type PERMISSIONS = {
  [key in PermissionType]?: PERMISSION_LEVELS;
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
  const configs = useConfigs() as any;
  const enableAPIExpose = configs?.enableAPIExpose;
  const showYieldManagementPermission = configs?.showYieldManagementPermission;
  const enableSocialCampaign = configs?.enableSocialCampaign;

  const initPermissions = (defaultPermissionsList: PERMISSIONS | undefined) => {
    let overridePermissions: any = {};

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
  };

  const initRole = () => {
    if (defaultRole) {
      return defaultRole;
    }
    return null;
  };

  const { permission: userPermission, isAdvertiser, isLoading } = useUser(); // using as userPermission to avoid readability conflict
  const hasCreativeFullAccess = useAppSelector(state =>
    checkAclFromState(state, PermissionType.CreativeTemplate, AccessLevel.FULL_ACCESS)
  );
  const hasOffsiteCampaignsNoAccess = useAppSelector(state =>
    checkAclFromState(state, PermissionType.OffsiteCampaigns, AccessLevel.NO_ACCESS)
  );
  const [permissions, setPermissions] = useState<any>({});
  const [customPermissions, setCustomPermissions] = useState<any>({});
  const [role, setRole] = useState<USER_ROLE | null>(initRole());

  const isYieldManagementEnabled = isAdvertiser
    ? showYieldManagementPermission?.showAdvertiser
    : showYieldManagementPermission?.showPublisher;

  useEffect(() => {
    const newRole = initRole();
    setRole(newRole);
  }, [defaultRole]);

  useEffect(() => {
    setPermissions(initPermissions(defaultPermissions));
    setCustomPermissions(initPermissions(defaultPermissions));
  }, [defaultPermissions]);

  const onCustomPermissionSelect = (option: PERMISSION_LEVELS, key: string) => {
    const per: any = { ...permissions };
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
          label: 'Standard',
          role: USER_ROLE.BASIC_USER,
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
        //     role: USER_ROLE.BASIC_USER,
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
        //     role: USER_ROLE.BASIC_USER,
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
        //     role: USER_ROLE.BASIC_USER,
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
        //     role: USER_ROLE.BASIC_USER,
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
        //     role: USER_ROLE.BASIC_USER,
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
        //     role: USER_ROLE.BASIC_USER,
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
        //     role: USER_ROLE.BASIC_USER,
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
            role: USER_ROLE.BASIC_USER,
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
                  ] as Array<string>
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
        //     role: USER_ROLE.BASIC_USER,
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
        //     role: USER_ROLE.BASIC_USER,
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
        //     role: USER_ROLE.BASIC_USER,
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
            role: USER_ROLE.BASIC_USER,
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
                  ] as Array<string>
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
            role: USER_ROLE.BASIC_USER,
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
                options={[PERMISSION_LEVELS.NO_ACCESS, PERMISSION_LEVELS.FULL_ACCESS_PUBLIC_KEY] as Array<string>}
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
        //     role: USER_ROLE.BASIC_USER,
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
            role: USER_ROLE.BASIC_USER,
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
                options={[PERMISSION_LEVELS.NO_ACCESS, PERMISSION_LEVELS.FULL_ACCESS] as Array<string>}
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
            role: USER_ROLE.BASIC_USER,
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
                options={[PERMISSION_LEVELS.NO_ACCESS, PERMISSION_LEVELS.FULL_ACCESS] as Array<string>}
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
          label: 'Standard',
          role: USER_ROLE.BASIC_USER,
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
        {
          c1: {
            role: 'none',
            content: 'All Advertiser’s Campaigns',
          },
          c2: {
            role: USER_ROLE.BASIC_USER,
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
                  ] as Array<string>
                }
                permissionKey={PermissionType.AllAdvertiserCampaigns}
                onPermissionSelect={handlePermissionSelect(PermissionType.AllAdvertiserCampaigns)}
                selectedPermission={permissions[PermissionType.AllAdvertiserCampaigns] as PERMISSION_LEVELS}
              />
            ),
          },
        },
        {
          c1: {
            role: 'none',
            content: 'Report Generation',
          },
          c2: {
            role: USER_ROLE.BASIC_USER,
            content: PERMISSION_LEVELS.CAMPAIGN_LEVEL,
          },
          c3: {
            role: USER_ROLE.SUPER_USER,
            content: PERMISSION_LEVELS.CAMPAIGN_LEVEL,
          },
          c4: {
            role: USER_ROLE.CUSTOM_USER,
            content: (
              <CustomPermission
                disabled={disabled}
                options={[PERMISSION_LEVELS.NO_ACCESS, PERMISSION_LEVELS.CAMPAIGN_LEVEL] as Array<string>}
                permissionKey={PermissionType.ReportGeneration}
                onPermissionSelect={handlePermissionSelect(PermissionType.ReportGeneration)}
                selectedPermission={
                  role !== USER_ROLE.CUSTOM_USER && userType !== USER_TYPE.PUBLISHER
                    ? (advertiser_permissions[PermissionType.ReportGeneration] as PERMISSION_LEVELS)
                    : (permissions[PermissionType.ReportGeneration] as PERMISSION_LEVELS)
                }
              />
            ),
          },
        },
        {
          c1: {
            role: 'none',
            content: 'User Management',
          },
          c2: {
            role: USER_ROLE.BASIC_USER,
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
                  ] as Array<string>
                }
                permissionKey={PermissionType.UserManagement}
                onPermissionSelect={handlePermissionSelect(PermissionType.UserManagement)}
                selectedPermission={permissions[PermissionType.UserManagement] as PERMISSION_LEVELS}
              />
            ),
          },
        },
        {
          c1: {
            role: 'none',
            content: 'Wallets',
          },
          c2: {
            role: USER_ROLE.BASIC_USER,
            content: PERMISSION_LEVELS.VIEW_ONLY,
          },
          c3: {
            role: USER_ROLE.SUPER_USER,
            content: PERMISSION_LEVELS.MANAGE_WALLET,
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
                    PERMISSION_LEVELS.MANAGE_WALLET,
                  ] as Array<string>
                }
                permissionKey={PermissionType.Wallet}
                onPermissionSelect={handlePermissionSelect(PermissionType.Wallet)}
                selectedPermission={permissions[PermissionType.Wallet] as PERMISSION_LEVELS}
              />
            ),
          },
        },
        {
          c1: {
            role: 'none',
            content: 'Insights Management',
          },
          c2: {
            role: USER_ROLE.BASIC_USER,
            content: PERMISSION_LEVELS.NO_ACCESS,
          },
          c3: {
            role: USER_ROLE.SUPER_USER,
            content: PERMISSION_LEVELS.VIEW_ONLY,
          },
          c4: {
            role: USER_ROLE.CUSTOM_USER,
            content: (
              <CustomPermission
                disabled={disabled}
                options={[PERMISSION_LEVELS.NO_ACCESS, PERMISSION_LEVELS.VIEW_ONLY] as Array<string>}
                permissionKey={PermissionType.InsightDashboard}
                onPermissionSelect={handlePermissionSelect(PermissionType.InsightDashboard)}
                selectedPermission={permissions[PermissionType.InsightDashboard] as PERMISSION_LEVELS}
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
            role: USER_ROLE.BASIC_USER,
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
                options={[PERMISSION_LEVELS.NO_ACCESS, PERMISSION_LEVELS.FULL_ACCESS_REPORT] as Array<string>}
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
            role: USER_ROLE.BASIC_USER,
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
                options={[PERMISSION_LEVELS.NO_ACCESS, PERMISSION_LEVELS.FULL_ACCESS] as Array<string>}
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
          role: USER_ROLE.BASIC_USER,
        },
      ],
      rows: [
        // {
        //   c1: {
        //     role: 'none',
        //     content: 'Ad Inventory and Placements',
        //   },
        //   c2: {
        //     role: USER_ROLE.BASIC_USER,
        //     content: defaultPermissions?.AD_INVENTORY_PLACEMENTS,
        //   },
        // },
        // {
        //   c1: {
        //     role: 'none',
        //     content: 'Audience and Key/values',
        //   },
        //   c2: {
        //     role: USER_ROLE.BASIC_USER,
        //     content: defaultPermissions?.AUDIENCE_KEYS_VALUES,
        //   },
        // },
        // {
        //   c1: {
        //     role: 'none',
        //     content: 'All Publisher’s Campaigns',
        //   },
        //   c2: {
        //     role: USER_ROLE.BASIC_USER,
        //     content: defaultPermissions?.ALL_PUBLISHER_CAMPAIGNS,
        //   },
        // },
        // {
        //   c1: {
        //     role: 'none',
        //     content: 'All Advertiser’s Campaigns',
        //   },
        //   c2: {
        //     role: USER_ROLE.BASIC_USER,
        //     content: defaultPermissions?.ALL_ADVERTISER_CAMPAIGNS,
        //   },
        // },
        // {
        //   c1: {
        //     role: 'none',
        //     content: 'Creative Templates',
        //   },
        //   c2: {
        //     role: USER_ROLE.BASIC_USER,
        //     content: defaultPermissions?.CREATIVE_TEMPLATE,
        //   },
        // },
        // {
        //   c1: {
        //     role: 'none',
        //     content: 'Report Generation',
        //   },
        //   c2: {
        //     role: USER_ROLE.BASIC_USER,
        //     content: defaultPermissions?.REPORT_GENERATION,
        //   },
        // },
        // {
        //   c1: {
        //     role: 'none',
        //     content: 'Advertisers Management',
        //   },
        //   c2: {
        //     role: USER_ROLE.BASIC_USER,
        //     content: defaultPermissions?.ADVERTISER_MANAGEMENT,
        //   },
        // },
        {
          c1: {
            role: 'none',
            content: 'User Management',
          },
          c2: {
            role: USER_ROLE.BASIC_USER,
            content: defaultPermissions?.USER_MANAGEMENT,
          },
        },
        // {
        //   c1: {
        //     role: 'none',
        //     content: 'Approval Requests',
        //   },
        //   c2: {
        //     role: USER_ROLE.BASIC_USER,
        //     content: defaultPermissions?.APPROVAL_REQUESTS,
        //   },
        // },
        // {
        //   c1: {
        //     role: 'none',
        //     content: 'Wallets',
        //   },
        //   c2: {
        //     role: USER_ROLE.BASIC_USER,
        //     content: defaultPermissions?.WALLET,
        //   },
        // },
        // {
        //   c1: {
        //     role: 'none',
        //     content: 'Insights Management',
        //   },
        //   c2: {
        //     role: USER_ROLE.BASIC_USER,
        //     content: defaultPermissions?.INSIGHT_DASHBOARD,
        //   },
        // },
        {
          c1: {
            role: 'none',
            content: 'Account Settings',
          },
          c2: {
            role: USER_ROLE.BASIC_USER,
            content: defaultPermissions?.ACCOUNT_SETUP,
          },
        },
        // {
        //   c1: {
        //     role: 'none',
        //     content: 'Yield Management',
        //   },
        //   c2: {
        //     role: USER_ROLE.BASIC_USER,
        //     content: defaultPermissions?.YIELD_MANAGEMENT,
        //   },
        // },
        {
          c1: {
            role: 'none',
            content: 'Public API Access',
          },
          c2: {
            role: USER_ROLE.BASIC_USER,
            content: defaultPermissions?.PUBLIC_API_ACCESS,
          },
        },
        {
          c1: {
            role: 'none',
            content: 'Offsite Integrations',
          },
          c2: {
            role: USER_ROLE.BASIC_USER,
            content: defaultPermissions?.OFFSITE_INTEGRATIONS,
          },
        },
        {
          c1: {
            role: 'none',
            content: 'Offsite Campaigns',
          },
          c2: {
            role: USER_ROLE.BASIC_USER,
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
      const permission: any = { ...customPermissions };
      per[key] = permission[key];
    });
    onUpdatePermissions(userRole, per);
  };

  if (isLoading) {
    return null;
  }

  const renderPermissionContent = (content: any) => {
    if (!content) return 'No Access';

    if (typeof content === 'string') {
      return content;
    }

    if (typeof content === 'object') {
      if (content.fullAccess) return 'Full Access';
      if (content.fullAccessReport) return 'Full Access Report';
      if (content.fullAccessPublicKey) return 'Full Access Public Key';
      if (content.viewAccess) return 'View Only';
      if (content.campaignLevel) return 'Campaign Level';
      if (content.comprehensiveAccess) return 'Comprehensive Access';
      if (content.manageWallet) return 'Manage Wallet';
      if (content.approvalAccess) return 'Approval Access';
      if (content.allRequests) return 'All Requests';
      if (content.creativeRequests) return 'Creative Requests';
      if (content.noAccess) return 'No Access';
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
                  return (
                    <TableCell
                      onClick={() => (disabled ? undefined : onRoleChange(item.role))}
                      key={item.role}
                      className={styles.tableHeadCell}
                      data-id={role === item.role}
                    >
                      <div
                        className={styles.role_info_wrapper}
                        onClick={() => (disabled ? undefined : onRoleChange(item.role))}
                      >
                        <Typography
                          variant="body-semibold"
                          data-testid={
                            item.label == 'Custom'
                              ? 'user-custom-role-option'
                              : item.label == 'Admin'
                              ? 'user-admin-role-option'
                              : item.label == 'Standard'
                              ? 'user-standard-role-option'
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
              (item: any, index: number) => (
                <TableRow key={index}>
                  {Object.keys(item).map(key => (
                    <TableCell
                      key={key}
                      className={styles.tableBodyCell}
                      data-id={role === item[key].role}
                      data-first={item[key].role === 'none'}
                    >
                      <div className={styles.permission_info_wrapper} data-testid="user-access-permission">
                        {key === 'c1' ? item[key].content : renderPermissionContent(item[key].content)}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ),
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
  standardOption: string;
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
