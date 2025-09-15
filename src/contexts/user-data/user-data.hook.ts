import { useContext, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { IRootState } from '@/redux/reducers';
import { AuthUser, UserType } from '@/types';
import { UserDataContext } from '@/contexts/user-data/user-data.provider';

type UseUserReturn = {
  user: AuthUser | null;
  isPublisher: boolean;
  isAdvertiser: boolean;
  permission: Record<string, any> | null;
  isLoading: boolean;
};

const useUser = (): UseUserReturn => {
  const context = useContext(UserDataContext);

  // Fallbacks using Redux in case context is not available
  const userFromRedux = useSelector((state: IRootState) => state.auth.user) as AuthUser | null;
  console.log(userFromRedux,'userFromRedux');
  const role = (userFromRedux?.userType ?? '').toString().toLowerCase();
  const isPublisherFromRedux = role === UserType.Publisher;
  const isAdvertiserFromRedux = role === UserType.Advertiser;
  const permissionFromRedux = useMemo(() => null, []);

  const user = (context.user as AuthUser | null) ?? userFromRedux ?? null;
  const isPublisher = context.isPublisher ?? isPublisherFromRedux;
  const isAdvertiser = context.isAdvertiser ?? isAdvertiserFromRedux;
  const permission = (context.permission as Record<string, any> | null) ?? permissionFromRedux;
  const isLoading = Boolean(context.isLoading);
  console.log(isPublisher,'isPublisher');

  return { user, isPublisher, isAdvertiser, permission, isLoading };
};

export default useUser;


