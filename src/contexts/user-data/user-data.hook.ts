import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { IRootState } from '@/redux/reducers';
import { AuthUser } from '@/types';

type UseUserReturn = {
  user: AuthUser | null;
  isPublisher: boolean;
  isAdvertiser: boolean;
  permission: Record<string, any> | null;
};

const useUser = (): UseUserReturn => {
  const user = useSelector((state: IRootState) => state.auth.user) as AuthUser | null;

  const role = (user?.role ?? '').toString().toLowerCase();
  const isPublisher = role === 'publisher';
  const isAdvertiser = role === 'advertiser';

  const permission = useMemo(() => null, []);

  return { user, isPublisher, isAdvertiser, permission };
};

export default useUser;


