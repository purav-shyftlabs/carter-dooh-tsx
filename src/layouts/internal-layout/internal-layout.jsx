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
// import TopBar from './topbar/topbar.component';

const InternalLayout = ({ children, head = {} }) => {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useSelector(state => state.auth);
  const { userDisplayName, userEmail, logout } = useUserData();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting to prevent hydration mismatches
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, isLoading, router, mounted]);

  const toggleSidebar = (open) => {
    setSidebarOpen(open);
  };

  // Show loading while checking auth state or before mounting
  if (!mounted || isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Head>
          <title>Loading...</title>
        </Head>
        <div className={styles.loadingContent}>
          <Typography variant="h1-bold">Loading...</Typography>
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
    <div className={styles.container}>
      <Head>
        <title>{head.title || 'Dashboard'}</title>
        <meta name="description" content={head.description || 'Internal Dashboard'} />
      </Head>

      {/* Main Content with Sidebar */}
      {/* <TopBar logoSrc={client?.invertLogo || ''} /> */}

      <div className={styles.layout}>
        <div className={styles.sidebar}>
          <SidebarComponent />
        </div>
        <Drawer 
          open={sidebarOpen} 
          onClose={() => toggleSidebar(false)}
          variant="temporary"
        >
          <SidebarComponent />
        </Drawer>
        <div className={styles.content}>{children}</div>
        {/* {enableChatAgent && <ChatAgent />} */}
      </div>
    </div>
  );
};

export default InternalLayout;
