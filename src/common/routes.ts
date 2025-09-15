const AUTH_ROUTES = {
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  SET_PASSWORD: '/auth/set-password',
  LOGIN: '/auth/login',
  LOGOUT: '/api/auth/logout',
};
const USERS_ROUTES = {
  ADD: '/users/add',
  LIST: '/users',
};
const ROUTES = {
  DASHBOARD: '/dashboard',
  BILLBOARD: '/billboard',
  AUTH: AUTH_ROUTES,
  INSIGHTS: '/insights',
  USERS:USERS_ROUTES,
  ACCOUNT: {
    BASE: '/account',
  },
};

export default ROUTES;
