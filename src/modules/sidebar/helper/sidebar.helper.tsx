import { FileCheck, FolderOpen, Video, Plug2, LayoutIcon } from 'lucide-react';
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
  // const hasSettingsView = useAppSelector(state =>
  //   checkAclFromState(state, PermissionType.AccountSetup, AccessLevel.VIEW_ACCESS)
  // );

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
      link: ROUTES.BILLBOARD.LIST,
      // show: hasBillboardView,
      assist: 'billboard',
      subCategories: [
        {
          id: 0,
          label: 'Screens',
          link: ROUTES.BILLBOARD.LIST,
          testId: 'screens-submenu-item',
          assist: 'screens',
          show: true,
        },
        {
          id: 1,
          label: 'Push Content',
          link: ROUTES.BILLBOARD.PUSH_CONTENT,
          testId: 'push-content-submenu-item',
          assist: 'push-content',
          show: true,
        },
      ],
    },
    {
      id: 3,
      label: 'Content',
      type: 'button',
      icon: <FolderOpen width={16} height={16} />,
      link: ROUTES.CONTENT.LIST,
      assist: 'content',
      subCategories: [
        {
          id: 0,
          label: 'All',
          link: ROUTES.CONTENT.LIST,
          testId: 'all-submenu-item',
          assist: 'all',
          show: true,
        },
        {
          id: 1,
          label: 'Images',
          link: ROUTES.CONTENT.IMAGES,
          testId: 'images-submenu-item',
          assist: 'images',
          show: true,
        },
        {
          id: 2,
          label: 'Videos',
          link: ROUTES.CONTENT.VIDEOS,
          testId: 'videos-submenu-item',
          assist: 'videos',
          show: true,
        },
        {
          id: 3,
          label: 'Docs',
          link: ROUTES.CONTENT.DOCS,
          testId: 'docs-submenu-item',
          assist: 'docs',
          show: true,
        },
      ],
      show: true,
    },
    {
      id: 4,
      label: 'Playlist',
      icon: <Video width={16} height={16} />,
      link: ROUTES.PLAYLIST.LIST,
      show: true,
    },
    {
      id: 5,
      label: 'Users',
      icon: <UsersIcon width={16} height={16} />,
      link: ROUTES.USERS.LIST,
      show: hasUsersView,
    },
    {
      id: 6,
      label: 'Brand',
      icon: <FileCheck width={16} height={16} />,
      link: ROUTES.BRAND.LIST,
      // show: hasBrandView,
    },
    {
      id: 7,
      label: 'Layouts',
      icon: <LayoutIcon width={16} height={16} />,
      link: ROUTES.LAYOUTS.LIST,
      // show: hasLayoutView,
    },
    {
      id: 8,
      label: 'Integrations',
      icon: <Plug2 width={16} height={16} />,
      link: ROUTES.INTEGRATIONS.LIST,
      show: true,
      testId: 'integrations',
      assist: 'integrations',
    },
    {
      id: 9,
      label: 'Account Settings',
      icon: <SettingsIcon width={16} height={16} />,
      link: ROUTES.ACCOUNT.BASE,
      // show:  hasSettingsView,
      testId: 'settings',
      assist: 'settings',
      position: 'bottom',
    },
  ];

  return {
    MenuItems,
  };
};

export const isActiveRoute = (router: NextRouter, link: string | undefined) => {
  // Handle undefined or non-string links
  if (!link || typeof link !== 'string') {
    return false;
  }

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
