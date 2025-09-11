import logo from '@/assets/images/logo.png';
import billboard from '@/assets/images/billboard.png';
const useConfigs = () => {
  const configs ={ client: { name: 'Advertising', logo: logo, appSnapshotImage: billboard.src, tag: 'Welcome Back', website: 'https://www.google.com', termsAndCondition: 'https://www.google.com', privacyPolicy: 'https://www.google.com' } }
  return configs;
};

export default useConfigs;
