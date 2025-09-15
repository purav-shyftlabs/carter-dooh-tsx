import React, { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import authService from '@/services/auth/auth-service';
import { UserType } from '@/types';

export type TUserContext = {
  user?: Record<string, unknown> | null;
  isLoading: boolean;
  isLoadingPermission?: boolean;
  permission?: Array<Record<string, unknown>> | null;
  isAdvertiser?: boolean;
  isPublisher?: boolean;
  refetchUser: () => Promise<void>;
};

export const UserDataContext = React.createContext<TUserContext>({ isLoading: false, refetchUser: async () => {} });

const fetcher = async () => {
  const me = await authService.getMe();
  return me as Record<string, unknown> | null;
};

const UserDataProvider = ({ children }: { children: React.ReactNode }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const hasToken = typeof window !== 'undefined' ? Boolean(localStorage.getItem('token')) : false;

  const {
    data: userData,
    isLoading,
    mutate,
  } = useSWR(isClient && hasToken ? ['users/me'] : null, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateOnMount: true,
  });

  const refetchUser = async () => {
    await mutate();
  };

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
      refetchUser,
    };
  }, [isClient, userData, isLoading]);

  return <UserDataContext.Provider value={contextValue}>{children}</UserDataContext.Provider>;
};

export default UserDataProvider;


