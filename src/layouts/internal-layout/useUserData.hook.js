import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/router';
import { logout, authSetUser } from '@/redux/actions';
import authService from '@/services/auth/auth-service';

// Custom hook for user data and auth operations
export const useUserData = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const authState = useSelector(state => state.auth);

  const {
    user,
    token,
    refreshToken,
    isAuthenticated,
    isLoading,
    error
  } = authState;

  // User information helpers
  const getUserDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.name) {
      return user.name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    const words = name.split(' ');
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return name[0]?.toUpperCase() || 'U';
  };

  const getUserEmail = () => {
    return user?.email || '';
  };

  const getUserRole = () => {
    return user?.role || user?.userType || 'user';
  };

  const isAdmin = () => {
    const role = getUserRole().toLowerCase();
    return role === 'admin' || role === 'administrator';
  };

  // Auth operations
  const handleLogout = async () => {
    try {
      await dispatch(logout());
      router.replace('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUserProfile = (userData) => {
    dispatch(authSetUser({ ...user, ...userData }));
  };

  // Token helpers
  const getAuthHeaders = () => {
    if (token) {
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
    }
    return {
      'Content-Type': 'application/json'
    };
  };

  const isTokenExpired = () => {
    if (!token) return true;
    
    const payload = authService.parseJWT(token);
    if (!payload) return true;

    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  };

  // Navigation helpers
  const navigateToProfile = () => {
    router.push('/profile');
  };

  const navigateToSettings = () => {
    router.push('/settings');
  };

  const navigateToDashboard = () => {
    router.push('/dashboard');
  };

  return {
    // User data
    user,
    userDisplayName: getUserDisplayName(),
    userInitials: getUserInitials(),
    userEmail: getUserEmail(),
    userRole: getUserRole(),
    isAdmin: isAdmin(),
    
    // Auth state
    isAuthenticated,
    isLoading,
    error,
    
    // Tokens
    token,
    refreshToken,
    authHeaders: getAuthHeaders(),
    isTokenExpired: isTokenExpired(),
    
    // Actions
    logout: handleLogout,
    updateUserProfile,
    
    // Navigation
    navigateToProfile,
    navigateToSettings,
    navigateToDashboard
  };
};

export default useUserData;
