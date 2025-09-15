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
// import TopBar from './topbar/topbar.component';

const InternalLayout = ({ children, head = {} }) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading } = useSelector(state => state.auth);
  const { userDisplayName, userEmail, logout } = useUserData();
  const sidebarOpen = useSelector(state => state.layout.sidebarOpen);
  console.log(sidebarOpen,'sidebarOpen');
  const [mounted, setMounted] = useState(false);

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
  // const { sidebar } = useSelector((state) => state.common);


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
          <div className={styles.content}>{children}</div>
          {/* {enableChatAgent && <ChatAgent />} */}
        </div>
      </div>
    </UserDataProvider>
  );
};

export default InternalLayout;
