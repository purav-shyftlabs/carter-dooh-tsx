import logo from '@/assets/images/logo.png';
import billboard from '@/assets/images/billboard.png';

export type AppConfigs = {
  client: {
    name: string;
    logo: unknown;
    appSnapshotImage: string;
    tag: string;
    website: string;
    termsAndCondition: string;
    privacyPolicy: string;
  };
  enableAPIExpose?: { showAdvertiser?: boolean; showPublisher?: boolean };
  showYieldManagementPermission?: { showAdvertiser?: boolean; showPublisher?: boolean };
  enableSocialCampaign?: { showAdvertiser?: boolean; showPublisher?: boolean };
};

const useConfigs = (): AppConfigs => {
  const configs: AppConfigs = {
    client: {
      name: 'Advertising',
      logo: logo as unknown,
      appSnapshotImage: billboard.src,
      tag: 'Welcome Back',
      website: 'https://www.google.com',
      termsAndCondition: 'https://www.google.com',
      privacyPolicy: 'https://www.google.com',
    },
  };
  return configs;
};

export default useConfigs;
