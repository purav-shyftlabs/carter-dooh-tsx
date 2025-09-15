import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';

const useTabChangeHelper = () => {
  const router = useRouter();
  const currentTab = useSearchParams().get('tab') as string;

  const handleTabChange = (tab: string) => {
    const pathname = router.asPath.split('?')[0];
    router.push({
      pathname,
      query: {
        tab,
      },
    });
  };

  return {
    currentTab,
    handleTabChange,
  };
};

export default useTabChangeHelper;
