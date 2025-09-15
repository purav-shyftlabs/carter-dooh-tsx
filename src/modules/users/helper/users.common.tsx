import { PermissionType } from '@/types';

export const UsersPageInfo = {
  advertiser: {
    label: 'Advertiser',
    tab: 'advertiser',
  },
  selfInfo: {
    label: 'Self Info',
    tab: 'selfTab',
  },
  publisher: {
    label: 'Publisher',
    tab: 'publisher',
  },
  title: 'User Management',
  actionButton: 'New User',
};

export const usersVars = {
  statusToggle: {
    testId: 'enable-disabled-user',
    titleDisable: 'Disable User ?',
    titleEnable: 'Enable User ?',
    messageDisable: 'This action will disable the user and they will not be able to access your network.',
    messageEnable: 'This action will enable the user',
  },

  resendDialog: {
    testId: 'resend-dialog',
    title: 'Resend Invitation?',
    message: 'This action will resend the invitation email to the user.',
    messageEnable: 'This action will enable the user',
    alert: 'Invitation email sent, please check your inbox for further instructions',
  },
  multipleSuspend: {
    testId: 'enable-disabled-user-multiple',
    titleDisable: 'Disable User(s) ?',
    titleEnable: 'Enable User(s) ?',
    messageDisable: 'This action will disable the user and they will not be able to access your network.',
    messageEnable: 'This action will enable the user',
  },
  confirmDisable: 'Yes, Disable',
  confirmEnable: 'Yes, Enable',
  error: 'error',
  info: 'info',
};

export const statusFiler = [
  {
    label: 'All Status',
    value: '',
  },
  {
    label: 'Active',
    value: 'true',
  },
  {
    label: 'Disabled',
    value: 'false',
  },
];

// Self Tab

export const selfVars = {
  keyCopySuccess: 'API key has been successfully copied',
  keyCopyFail: 'Failed to copy text to clipboard:',
  keyGenerateSuccess: 'Your API key has been generated successfully',
  keyGenerateFail: 'Your API key has been generation failed',
  invalidateSuccess: 'All API key(s) have been invalidated successfully and are no longer active',
  invalidateFail: 'API Key Invalidation Failed',
};

export const getPermissionKey = (key: string): string => {
  switch (key) {
    case PermissionType.YieldManagement:
      return 'YIELD';
    case PermissionType.CreativeTemplate:
      return 'CREATIVE_REQUESTS';
    case PermissionType.ApprovalRequests:
      return 'APPROVAL_REQUESTS';
    default:
      return key;
  }
};
