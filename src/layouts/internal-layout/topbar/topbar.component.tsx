import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Bell, Menu } from 'lucide-react';
import router from 'next/router';
import { Badge, carterColors, CarterInput, Tooltip } from 'shyftlabs-dsl';
import { useSelector } from 'react-redux';
import { deleteCookie } from 'cookies-next/client';
import { Drawer, Popover } from '@/lib/material-ui';
import MagnifyingGlass from '@/assets/images/magnifying_glass.svg';
import ROUTES from '@/common/routes';
import { IRootState } from '@/redux/reducers';
import AuthService from '@/services/auth/auth-service';
import styles from '../topbar/topbar.module.scss';
import useUser from '@/contexts/user-data/user-data.hook';
import UserProfile from '@/components/user-profile/user-profile.component';
import SearchInput from '@/components/search-input/search-input.component';

enum TopBarVariant {
  FULL,
  MEDIUM,
  COMPACT,
}

interface TopBarProps {
  logoSrc: string;
  userName?: string;
  userAvatar?: string;
}

const TopBar: React.FC<TopBarProps> = ({ logoSrc }) => {
  const [variant, setVariant] = useState<TopBarVariant>(TopBarVariant.FULL);
  const globalSearchAE = useRef<HTMLElement | null>(null);
  const [isGlobalSearchVisible, setIsGlobalSearchVisible] = useState<boolean>(false);
  const [notificationCount, setNotificationCount] = useState<number>(0);

  const isNotificationDrawerVisible = useSelector((state: IRootState) => state.auth.isLoading);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setVariant(TopBarVariant.FULL);
      } else if (window.innerWidth >= 768) {
        setVariant(TopBarVariant.MEDIUM);
      } else {
        setVariant(TopBarVariant.COMPACT);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showNotificationDrawer = () => {
    // TODO: Implement notification drawer toggle
  };

  const hideNotificationDrawer = () => {
    // TODO: Implement notification drawer toggle
  };

  const renderNotificationButton = () => (
    <Tooltip title="Notifications">
      <div className={styles.notificationWrapper}>
        <button
          className={styles.notificationButton}
          onClick={showNotificationDrawer}
          data-testid="notification-bell-button"
        >
          <Bell size={16} />
        </button>
        {notificationCount > 0 && (
          <div className={styles.notificationBadge}>
            <Badge variant="secondary" label={notificationCount.toString()} />
          </div>
        )}
      </div>
    </Tooltip>
  );

  const logout = async () => {
    try {
      // Call logout service
      await AuthService.logout();
      
      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('accounts');
      }
      
      // Clear cookies
      deleteCookie('access_token');
      deleteCookie('user_acl');
      
      // Redirect to login
      // wait for 1 second
      await new Promise(resolve => setTimeout(resolve, 3000));
      router.push(ROUTES.AUTH.LOGIN);
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local data and redirect
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('accounts');
      }
      deleteCookie('access_token');
      deleteCookie('user_acl');
      // wait for 1 second
      router.push(ROUTES.AUTH.LOGIN);
    }
  };
  return (
    <div className={styles.topbar}>
      <div className={styles.inner}>
        <div className={`${styles.logo} ${variant === TopBarVariant.COMPACT ? styles.logoCompact : ''}`}>
          <img src={logoSrc} alt="Logo" width={140} height={30} />
        </div>

        {variant === TopBarVariant.COMPACT && (
          <button className={styles.iconButton} onClick={() => {/* TODO: Implement sidebar toggle */}}>
            <Menu size={24} />
          </button>
        )}

        <div className={styles.search}>
          <SearchInput
            isLoading={false}
            debounce={1000}
            onChange={() => {}}
            value=""
            placeholder="Search"
            type="text"
            
            onClick={({ currentTarget }: { currentTarget: HTMLElement }) => {
              globalSearchAE.current = currentTarget;
              setIsGlobalSearchVisible(true);
            }}
          />
        </div>

        {variant === TopBarVariant.FULL && (
          <div className={styles.right}>
            <div className={styles.icons_wrapper}>
              {renderNotificationButton()}
            </div>
            <UserProfile isLoading={false} logout={logout} />
          </div>
        )}

        {variant === TopBarVariant.MEDIUM && <div className={styles.right}>{renderNotificationButton()}</div>}

        {variant === TopBarVariant.COMPACT && <div className={styles.right}>{renderNotificationButton()}</div>}
      </div>

      <Popover
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        onClose={() => setIsGlobalSearchVisible(false)}
        open={!!globalSearchAE && isGlobalSearchVisible}
        anchorEl={globalSearchAE.current}
        sx={{ zIndex: 999, marginTop: -2 }}
        slotProps={{
          paper: {
            sx() {
              return {
                width: '60%',
              };
            },
          },
        }}
      >
        <div>Search functionality coming soon...</div>
      </Popover>

      <Drawer anchor="right" onClose={hideNotificationDrawer} open={isNotificationDrawerVisible}>
        <div>Notifications coming soon...</div>
      </Drawer>
    </div>
  );
};

export default TopBar;
