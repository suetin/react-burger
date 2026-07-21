import { createAsyncThunk } from '@reduxjs/toolkit';

import { getUser, loginUser, logoutUser, registerUser, updateUser } from '@utils/api';
import { clearTokens, getRefreshToken, setTokens } from '@utils/token-storage';

import type { RootState } from '@services/store';
import type { TLoginData, TRegisterData, TUpdateUserData, TUser } from '@utils/types';

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Неизвестная ошибка';

export const registerUserThunk = createAsyncThunk<
  TUser,
  TRegisterData,
  { rejectValue: string }
>('user/register', async (data, { rejectWithValue }) => {
  try {
    const response = await registerUser(data);
    setTokens(response.accessToken, response.refreshToken);
    return response.user;
  } catch (error) {
    return rejectWithValue(errorMessage(error));
  }
});

export const loginUserThunk = createAsyncThunk<
  TUser,
  TLoginData,
  { rejectValue: string }
>('user/login', async (data, { rejectWithValue }) => {
  try {
    const response = await loginUser(data);
    setTokens(response.accessToken, response.refreshToken);
    return response.user;
  } catch (error) {
    return rejectWithValue(errorMessage(error));
  }
});

export const checkUserAuth = createAsyncThunk<
  TUser | null,
  void,
  { rejectValue: string; state: RootState }
>(
  'user/checkAuth',
  async (_, { rejectWithValue }) => {
    if (!getRefreshToken()) return null;
    try {
      return (await getUser()).user;
    } catch (error) {
      clearTokens();
      return rejectWithValue(errorMessage(error));
    }
  },
  { condition: (_, { getState }) => getState().user.authStatus === 'idle' }
);

export const updateUserThunk = createAsyncThunk<
  TUser,
  TUpdateUserData,
  { rejectValue: string }
>('user/update', async (data, { rejectWithValue }) => {
  try {
    return (await updateUser(data)).user;
  } catch (error) {
    return rejectWithValue(errorMessage(error));
  }
});

export const logoutUserThunk = createAsyncThunk<void, void, { rejectValue: string }>(
  'user/logout',
  async (_, { rejectWithValue }) => {
    const token = getRefreshToken();
    try {
      if (token) await logoutUser(token);
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    } finally {
      clearTokens();
    }
  }
);
