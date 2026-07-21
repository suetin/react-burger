import { createSlice, isAnyOf } from '@reduxjs/toolkit';

import {
  checkUserAuth,
  loginUserThunk,
  logoutUserThunk,
  registerUserThunk,
  updateUserThunk,
} from '@services/user/actions';

import type { RootState } from '@services/store';
import type { TUser } from '@utils/types';

type TAuthStatus = 'checking' | 'checked' | 'idle';
type TUserState = {
  authStatus: TAuthStatus;
  error: string | null;
  isLoading: boolean;
  user: TUser | null;
};

const initialState: TUserState = {
  authStatus: 'idle',
  error: null,
  isLoading: false,
  user: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(checkUserAuth.pending, (state) => {
        state.authStatus = 'checking';
      })
      .addCase(checkUserAuth.fulfilled, (state, action) => {
        state.authStatus = 'checked';
        state.user = action.payload;
      })
      .addCase(checkUserAuth.rejected, (state, action) => {
        state.authStatus = 'checked';
        state.error = action.payload ?? null;
        state.user = null;
      })
      .addCase(logoutUserThunk.fulfilled, (state) => {
        state.authStatus = 'checked';
        state.error = null;
        state.isLoading = false;
        state.user = null;
      })
      .addCase(logoutUserThunk.rejected, (state, action) => {
        state.authStatus = 'checked';
        state.error = action.payload ?? 'Не удалось выйти';
        state.isLoading = false;
        state.user = null;
      })
      .addMatcher(
        isAnyOf(
          registerUserThunk.pending,
          loginUserThunk.pending,
          updateUserThunk.pending,
          logoutUserThunk.pending
        ),
        (state) => {
          state.error = null;
          state.isLoading = true;
        }
      )
      .addMatcher(
        isAnyOf(
          registerUserThunk.fulfilled,
          loginUserThunk.fulfilled,
          updateUserThunk.fulfilled
        ),
        (state, action) => {
          state.authStatus = 'checked';
          state.isLoading = false;
          state.user = action.payload;
        }
      )
      .addMatcher(
        isAnyOf(
          registerUserThunk.rejected,
          loginUserThunk.rejected,
          updateUserThunk.rejected
        ),
        (state, action) => {
          state.error = action.payload ?? 'Не удалось выполнить запрос';
          state.isLoading = false;
        }
      );
  },
});

export const userReducer = userSlice.reducer;
export const selectUser = (state: RootState): TUser | null => state.user.user;
export const selectIsAuthChecked = (state: RootState): boolean =>
  state.user.authStatus === 'checked';
export const selectUserLoading = (state: RootState): boolean => state.user.isLoading;
export const selectUserError = (state: RootState): string | null => state.user.error;
