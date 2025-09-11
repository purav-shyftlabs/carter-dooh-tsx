import { FileCheck } from 'lucide-react';
import { HomeIcon } from '@/lib/icons';
import ROUTES from '@/common/routes';


export const useSidebarMenuList = () => {
  const MenuItems = [
    {
      id: 1,
      label: 'Dashboard',
      icon: <HomeIcon width={16} height={16} />,
      type: 'button',
      link: ROUTES.DASHBOARD,
      show: true,
      testId: 'dashboard',
      assist: 'dashboard',
    },
    {
      id: 2,
      label: 'Billboard',
      icon: <FileCheck width={16} height={16} />,
      link: ROUTES.BILLBOARD,
      show: true,
      testId: 'billboard',
      assist: 'billboard',
    },
  ];

  return {
    MenuItems,
  };
};

export const isActiveRoute = (router, link) => {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const fullLink = basePath + link;
  const currentPath = router.asPath;

  // Exact match
  if (currentPath === link || currentPath === fullLink) return true;

  // Nested route match (/link/...)
  if (currentPath.startsWith(link + '/') || currentPath.startsWith(fullLink + '/')) return true;

  // Query param match (/link?...)
  if (currentPath.startsWith(link + '?') || currentPath.startsWith(fullLink + '?')) return true;

  // Path segment match
  const currentSegments = currentPath.split('?')[0].split('/');
  const linkSegments = link.split('/');
  if (linkSegments.every((segment, i) => segment === currentSegments[i])) return true;

  return false;
};
