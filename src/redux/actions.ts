import { Dispatch } from 'redux';
import { AuthUser } from '@/types';
import * as types from './types';
import authService from '@/services/auth/auth-service';

export const authClearError = () => ({ type: types.AUTH_CLEAR_ERROR });
export const authSetUser = (user: AuthUser) => ({ type: types.AUTH_SET_USER, payload: user });

export const login = (credentials: { email: string; password: string }) => async (dispatch: Dispatch) => {
  try {
    dispatch({ type: types.AUTH_LOGIN_REQUEST });
    const result = await authService.login(credentials);
    const envelope = (result && typeof result === 'object' && 'data' in result) ? (result as any).data : result;
    const payload = {
      user: envelope?.user ?? (result as any)?.user ?? null,
      token: envelope?.token ?? (result as any)?.token ?? envelope?.accessToken ?? null,
      refreshToken: envelope?.refreshToken ?? (result as any)?.refreshToken ?? null,
    } as { user: any; token: string | null; refreshToken: string | null };
    if (typeof window !== 'undefined') {
      payload.token && localStorage.setItem('token', payload.token);
      payload.refreshToken && localStorage.setItem('refreshToken', payload.refreshToken);
      payload.user && localStorage.setItem('user', JSON.stringify(payload.user));
    }
    dispatch({ type: types.AUTH_LOGIN_SUCCESS, payload });
    return payload;
  } catch (err: any) {
    const message = err?.message || 'Login failed';
    dispatch({ type: types.AUTH_LOGIN_FAILURE, payload: message });
    throw err;
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
