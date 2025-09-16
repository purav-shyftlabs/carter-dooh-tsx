import React, { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { useDispatch } from 'react-redux';
import authService from '@/services/auth/auth-service';
import { UserType, AuthUser } from '@/types';
import { authSetUser } from '@/redux/actions';

export type TUserContext = {
  user?: Record<string, unknown> | null;
  isLoading: boolean;
  isLoadingPermission?: boolean;
  permission?: Array<Record<string, unknown>> | null;
  isAdvertiser?: boolean;
  isPublisher?: boolean;
  error?: Error | null;
  refetchUser: () => Promise<void>;
};

export const UserDataContext = React.createContext<TUserContext>({ isLoading: false, refetchUser: async () => {} });

const createFetcher = (dispatch: ReturnType<typeof useDispatch>) => async () => {
  try {
    console.log('Fetching user data from /users/me API...');
    const me = await authService.getMe();
    console.log('User data fetched successfully:', me);
    
    // Update Redux state with the fetched user data
    if (me) {
      console.log('Updating Redux state with user data:', me);
      dispatch(authSetUser(me as AuthUser));
      
      // Also update localStorage to keep it in sync
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(me));
        console.log('Updated localStorage with user data');
      }
    }
    
    return me as Record<string, unknown> | null;
  } catch (error) {
    console.error('Error fetching user data from /users/me:', error);
    // Don't throw the error, return null to prevent SWR from retrying indefinitely
    return null;
  }
};

const UserDataProvider = ({ children }: { children: React.ReactNode }) => {
  const [isClient, setIsClient] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const hasToken = typeof window !== 'undefined' ? Boolean(localStorage.getItem('token')) : false;

  // Sync Redux state with localStorage on mount
  useEffect(() => {
    if (isClient && hasToken) {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser) as AuthUser;
          console.log('Syncing Redux state with localStorage user data:', user);
          dispatch(authSetUser(user));
        }
      } catch (error) {
        console.error('Error parsing stored user data:', error);
      }
    }
  }, [isClient, hasToken, dispatch]);

  const fetcher = useMemo(() => createFetcher(dispatch), [dispatch]);

  const {
    data: userData,
    isLoading,
    error,
    mutate,
  } = useSWR(isClient && hasToken ? ['users/me'] : null, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    revalidateOnMount: true,
    refreshInterval: 0, // Disable automatic refresh
    dedupingInterval: 0, // Disable deduplication to ensure fresh calls
    errorRetryCount: 3,
    errorRetryInterval: 1000,
    onError: (error) => {
      console.error('SWR Error in UserDataProvider:', error);
    },
  });

  // Force fresh API call on mount and refresh
  useEffect(() => {
    if (isClient && hasToken) {
      // Force a fresh call by mutating the cache
      mutate();
    }
  }, [isClient, hasToken, mutate]);

  // Listen for page visibility changes to refresh user data when user returns to tab
  useEffect(() => {
    if (!isClient || !hasToken) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Page became visible, refreshing user data...');
        mutate();
      }
    };

    const handleBeforeUnload = () => {
      console.log('Page is about to unload, ensuring fresh data on next visit...');
      // Clear any cached data to ensure fresh fetch on next visit
      mutate();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isClient, hasToken, mutate]);

  const refetchUser = React.useCallback(async () => {
    await mutate();
  }, [mutate]);

  const contextValue: TUserContext = useMemo(() => {
    if (!isClient) return { isLoading: true, refetchUser: async () => {} };
    const permissions = (userData as { permissions?: Array<Record<string, unknown>> } | null)?.permissions ?? null;
    const userType = (userData as { userType?: string } | null)?.userType ?? null;
    return {
      user: userData ?? null,
      permission: permissions,
      isAdvertiser: userType === UserType.Advertiser,
      isPublisher: userType === UserType.Publisher,
      isLoading: Boolean(isLoading),
      isLoadingPermission: false,
      error: error || null,
      refetchUser,
    };
  }, [isClient, userData, isLoading, error, refetchUser]);

  return <UserDataContext.Provider value={contextValue}>{children}</UserDataContext.Provider>;
};

export default UserDataProvider;


