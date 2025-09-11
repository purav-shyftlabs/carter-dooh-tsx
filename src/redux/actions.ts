import { Dispatch } from 'redux';
import { AuthUser } from '@/types';
import * as types from './types';
import authService from '@/services/auth/auth-service';

export const authClearError = () => ({ type: types.AUTH_CLEAR_ERROR });
export const authSetUser = (user: AuthUser) => ({ type: types.AUTH_SET_USER, payload: user });

// Alert actions
export const removeAlert = (id: string) => ({ type: 'REMOVE_ALERT', payload: id });

export const login = (credentials: { email: string; password: string }) => async (dispatch: Dispatch) => {
  try {
    dispatch({ type: types.AUTH_LOGIN_REQUEST });
    const result = await authService.login(credentials);
    const envelope: unknown = (result && typeof result === 'object' && 'data' in (result as Record<string, unknown>))
      ? (result as Record<string, unknown>)['data']
      : result;
    const payload = {
      user: (envelope as Record<string, unknown>)?.user ?? (result as Record<string, unknown>)?.user ?? null,
      token:
        (envelope as Record<string, unknown>)?.token ??
        (result as Record<string, unknown>)?.token ??
        (envelope as Record<string, unknown>)?.accessToken ??
        null,
      refreshToken:
        (envelope as Record<string, unknown>)?.refreshToken ??
        (result as Record<string, unknown>)?.refreshToken ??
        null,
    } as { user: unknown; token: string | null; refreshToken: string | null };
    if (typeof window !== 'undefined') {
      payload.token && localStorage.setItem('token', payload.token);
      payload.refreshToken && localStorage.setItem('refreshToken', payload.refreshToken);
      payload.user && localStorage.setItem('user', JSON.stringify(payload.user));
    }
    dispatch({ type: types.AUTH_LOGIN_SUCCESS, payload });
    return payload;
  } catch (err) {
    console.error('Login action error:', err);
    const message =  (err as { message?: string }).message as string;
    dispatch({ type: types.AUTH_LOGIN_FAILURE, payload: message });
    throw new Error(message);
  }
};

export const logout = () => async (dispatch: Dispatch) => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }
  dispatch({ type: types.AUTH_LOGOUT });
};
