import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import Head from 'next/head';
import { Typography } from 'shyftlabs-dsl';
import { carterColors } from 'shyftlabs-dsl';
import { Drawer } from '@mui/material';
import { useUserData } from './useUserData.hook';
import SidebarComponent from '@/modules/sidebar/container/sidebar.container';
import styles from './internal-layout.module.scss';
import TopBar from './topbar/topbar.component';
import UserDataProvider from '@/contexts/user-data/user-data.provider';
import logo from '@/assets/images/logo-nav.png';
import { useAppDispatch } from '@/redux/hooks';
import { setSidebarOpen } from '@/redux/actions';
import { checkAclFromState } from '@/common/acl';
import { AccessLevel, PermissionType } from '@/types';
import ROUTES from '@/common/routes';
import UnauthorizedPage from '@/modules/access-control-layer/components/unauthorized.component';
// import TopBar from './topbar/topbar.component';

const InternalLayout = ({ children, head = {} }) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading } = useSelector(state => state.auth);
  const { userDisplayName, userEmail, logout } = useUserData();
  const sidebarOpen = useSelector(state => state.layout.sidebarOpen);
  console.log(sidebarOpen,'sidebarOpen');
  const [mounted, setMounted] = useState(false);

  // ACL guard per route (compute early so hooks run consistently)
  const routeToPermissionEarly = [
    // { match: ROUTES.DASHBOARD, permissionType: PermissionType.InsightDashboard },
    // { match: ROUTES.BILLBOARD, permissionType: PermissionType.AdInventoryPlacements },
    { match: ROUTES.USERS.LIST, permissionType: PermissionType.UserManagement },
    { match: ROUTES.ACCOUNT.BASE, permissionType: PermissionType.AccountSetup },
  ];
  const currentPathEarly = router.asPath && typeof router.asPath === 'string' ? router.asPath.split('?')[0] : '';
  const requiredEarly = routeToPermissionEarly.find(r => currentPathEarly === r.match || currentPathEarly.startsWith(r.match + '/'));
  const hasAccessEarly = useSelector(state => (requiredEarly ? checkAclFromState(state, requiredEarly.permissionType, AccessLevel.VIEW_ACCESS) : true));

  // Handle client-side mounting to prevent hydration mismatches
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close sidebar on route change
  useEffect(() => {
    const handleRouteChange = () => {
      dispatch(setSidebarOpen(false));
    };

    router.events.on('routeChangeStart', handleRouteChange);
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router.events, dispatch]);

  // Close sidebar when clicking outside (for mobile)
  const handleBackdropClick = () => {
    dispatch(setSidebarOpen(false));
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, isLoading, router, mounted]);

 
  // Show loading while checking auth state or before mounting
  if (!mounted || isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Head>
          <title>Loading...</title>
        </Head>
        <div className={styles.loadingContent}>
          <Typography fontFamily="Roboto" variant="h1-bold">Loading...</Typography>
        </div>
      </div>
    );
  }

  // Don't render if user is not authenticated (will redirect)
  if (!isAuthenticated) {
    router.replace('/auth/login');
  }
  // ACL guard done earlier (hasAccessEarly)

  const unauthorizedView = (
   <UnauthorizedPage />
  );


  return (
    <UserDataProvider>
      <div className={styles.container}>
        <Head>
          <title>{head.title || 'Dashboard'}</title>
          <meta name="description" content={head.description || 'Internal Dashboard'} />
        </Head>

        {/* Main Content with Sidebar */}
        <TopBar logoSrc={logo?.src} />

        <div className={styles.layout}>
          <div className={styles.sidebar}>
            <SidebarComponent />
          </div>
          <Drawer 
            open={sidebarOpen} 
            onClose={handleBackdropClick}
            variant="temporary"
          >
            <SidebarComponent />
          </Drawer>
          <div className={styles.content}>{hasAccessEarly ? children : unauthorizedView}</div>
          {/* {enableChatAgent && <ChatAgent />} */}
        </div>
      </div>
    </UserDataProvider>
  );
};

export default InternalLayout;
