import { FileCheck } from 'lucide-react';
import { HomeIcon, SettingsIcon, UsersIcon } from '@/lib/icons';
import ROUTES from '@/common/routes';
import { NextRouter } from 'next/router';
import { useAppSelector } from '@/redux/hooks';
import { checkAclFromState } from '@/common/acl';
import { AccessLevel, PermissionType } from '@/types';


export const useSidebarMenuList = () => {
  const hasDashboardView = useAppSelector(state =>
    checkAclFromState(state, PermissionType.InsightDashboard, AccessLevel.VIEW_ACCESS)
  );
  const hasBillboardView = useAppSelector(state =>
    checkAclFromState(state, PermissionType.AdInventoryPlacements, AccessLevel.VIEW_ACCESS)
  );
  const hasUsersView = useAppSelector(state =>
    checkAclFromState(state, PermissionType.UserManagement, AccessLevel.VIEW_ACCESS)
  );
  const hasSettingsView = useAppSelector(state =>
    checkAclFromState(state, PermissionType.AccountSetup, AccessLevel.VIEW_ACCESS)
  );

  const MenuItems = [
    {
      id: 1,
      label: 'Dashboard',
      icon: <HomeIcon width={16} height={16} />,
      type: 'button',
      link: ROUTES.DASHBOARD,
      // show: hasDashboardView,
      testId: 'dashboard',
      assist: 'dashboard',
    },
    {
      id: 2,
      label: 'Billboard',
      icon: <FileCheck width={16} height={16} />,
      link: ROUTES.BILLBOARD,
      // show: hasBillboardView,
      testId: 'billboard',
      assist: 'billboard',
    },
    {
      id: 3,
      label: 'Users',
      icon: <UsersIcon width={16} height={16} />,
      link: ROUTES.USERS.LIST,
      show: hasUsersView,
    },
    {
      id: 4,
      label: 'Brand',
      icon: <FileCheck width={16} height={16} />,
      link: ROUTES.BRAND.LIST,
      // show: hasBrandView,
    },
    {
      id: 4,
      label: 'Account Settings',
      icon: <SettingsIcon width={16} height={16} />,
      link: ROUTES.ACCOUNT.BASE,
      show:  hasSettingsView,
      testId: 'settings',
      assist: 'settings',
      position: 'bottom',
    },
  ];

  return {
    MenuItems,
  };
};

export const isActiveRoute = (router: NextRouter, link: string) => {
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
