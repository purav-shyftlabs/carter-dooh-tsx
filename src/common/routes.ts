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

const BRAND_ROUTES = {
  LIST: '/brand',
  ADD: '/brand/add',
};

const CONTENT_ROUTES = {
  LIST: '/content/all',
  IMAGES: '/content/images',
  VIDEOS: '/content/videos',
  DOCS: '/content/docs',
  ADD: '/content/add',
};

const PLAYLIST_ROUTES = {
  LIST: '/playlist',
  ADD: '/playlist/add',
};

const INTEGRATIONS_ROUTES = {
  LIST: '/integrations',
  APPS: '/integrations/apps',
  OAUTH_CALLBACK: '/integrations/oauth/callback',
};

const ROUTES = {
  DASHBOARD: '/dashboard',
  BILLBOARD: '/billboard',
  AUTH: AUTH_ROUTES,
  INSIGHTS: '/insights',
  USERS:USERS_ROUTES,
  BRAND: BRAND_ROUTES,
  CONTENT: CONTENT_ROUTES,
  PLAYLIST: PLAYLIST_ROUTES,
  INTEGRATIONS: INTEGRATIONS_ROUTES,
  ACCOUNT: {
    BASE: '/account',
  },
};

export default ROUTES;
