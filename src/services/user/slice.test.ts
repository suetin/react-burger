import { describe, expect, it } from 'vitest';

import {
  checkUserAuth,
  loginUserThunk,
  logoutUserThunk,
  registerUserThunk,
  updateUserThunk,
} from '@services/user/actions';
import { sessionInvalidated } from '@services/user/session';
import { userReducer } from '@services/user/slice';

import type { TUser } from '@utils/types';

type TUserState = {
  authStatus: 'checking' | 'checked' | 'idle';
  error: string | null;
  isLoading: boolean;
  user: TUser | null;
};

const createUser = (overrides: Partial<TUser> = {}): TUser => ({
  email: 'user@example.com',
  name: 'Тестовый пользователь',
  ...overrides,
});

const createState = (overrides: Partial<TUserState> = {}): TUserState => ({
  authStatus: 'idle',
  error: null,
  isLoading: false,
  user: null,
  ...overrides,
});

const requestError = new Error('request failed');

describe('userReducer', () => {
  it('returns the exact initial state for an unknown action', () => {
    expect(userReducer(undefined, { type: 'unknown' })).toEqual({
      authStatus: 'idle',
      error: null,
      isLoading: false,
      user: null,
    });
  });

  describe('checkUserAuth', () => {
    it('marks authentication as checking on pending', () => {
      const state = createState({
        error: 'old error',
        user: createUser(),
      });

      expect(userReducer(state, checkUserAuth.pending('request-id', undefined))).toEqual(
        {
          ...state,
          authStatus: 'checking',
        }
      );
    });

    it('stores the authenticated user on fulfilled', () => {
      const user = createUser({ email: 'new@example.com', name: 'Новый пользователь' });

      expect(
        userReducer(
          createState(),
          checkUserAuth.fulfilled(user, 'request-id', undefined)
        )
      ).toEqual({
        authStatus: 'checked',
        error: null,
        isLoading: false,
        user,
      });
    });

    it('stores null when fulfilled without an authenticated user', () => {
      expect(
        userReducer(
          createState({ user: createUser() }),
          checkUserAuth.fulfilled(null, 'request-id', undefined)
        )
      ).toEqual({
        authStatus: 'checked',
        error: null,
        isLoading: false,
        user: null,
      });
    });

    it.each([
      ['a payload error', 'Server rejected the session'],
      ['a missing payload', null],
    ] as const)('marks auth as checked and clears user for %s', (_label, payload) => {
      const state = createState({
        error: 'old error',
        isLoading: true,
        user: createUser(),
      });
      const action = payload
        ? checkUserAuth.rejected(requestError, 'request-id', undefined, payload)
        : checkUserAuth.rejected(requestError, 'request-id', undefined);

      expect(userReducer(state, action)).toEqual({
        authStatus: 'checked',
        error: payload,
        isLoading: true,
        user: null,
      });
    });
  });

  it('sessionInvalidated clears user, error, and loading state', () => {
    expect(
      userReducer(
        createState({
          authStatus: 'checking',
          error: 'session expired',
          isLoading: true,
          user: createUser(),
        }),
        sessionInvalidated()
      )
    ).toEqual({
      authStatus: 'checked',
      error: null,
      isLoading: false,
      user: null,
    });
  });

  describe('logoutUserThunk', () => {
    it('clears the user and starts loading on pending', () => {
      expect(
        userReducer(
          createState({ error: 'old error', user: createUser() }),
          logoutUserThunk.pending('request-id', undefined)
        )
      ).toEqual({
        authStatus: 'checked',
        error: null,
        isLoading: true,
        user: null,
      });
    });

    it('finishes successfully with an empty authenticated state', () => {
      expect(
        userReducer(
          createState({
            authStatus: 'checking',
            error: 'old error',
            isLoading: true,
            user: createUser(),
          }),
          logoutUserThunk.fulfilled(undefined, 'request-id', undefined)
        )
      ).toEqual({
        authStatus: 'checked',
        error: null,
        isLoading: false,
        user: null,
      });
    });

    it.each([
      ['a payload error', 'Logout failed'],
      ['a missing payload', null],
    ] as const)('stores %s and ends loading', (_label, payload) => {
      const state = createState({
        error: 'old error',
        isLoading: true,
        user: createUser(),
      });
      const action = payload
        ? logoutUserThunk.rejected(requestError, 'request-id', undefined, payload)
        : logoutUserThunk.rejected(requestError, 'request-id', undefined);

      expect(userReducer(state, action)).toEqual({
        authStatus: 'checked',
        error: payload ?? 'Не удалось выйти',
        isLoading: false,
        user: null,
      });
    });
  });

  const authThunkCases = [
    {
      label: 'registerUserThunk',
      arg: {
        email: 'register@example.com',
        name: 'Register User',
        password: 'password',
      },
      fulfilledUser: createUser({
        email: 'register@example.com',
        name: 'Register User',
      }),
      pending: (): ReturnType<typeof registerUserThunk.pending> =>
        registerUserThunk.pending('request-id', {
          email: 'register@example.com',
          name: 'Register User',
          password: 'password',
        }),
      fulfilled: (): ReturnType<typeof registerUserThunk.fulfilled> =>
        registerUserThunk.fulfilled(
          createUser({ email: 'register@example.com', name: 'Register User' }),
          'request-id',
          {
            email: 'register@example.com',
            name: 'Register User',
            password: 'password',
          }
        ),
      rejected: (payload?: string): ReturnType<typeof registerUserThunk.rejected> =>
        payload
          ? registerUserThunk.rejected(
              requestError,
              'request-id',
              {
                email: 'register@example.com',
                name: 'Register User',
                password: 'password',
              },
              payload
            )
          : registerUserThunk.rejected(requestError, 'request-id', {
              email: 'register@example.com',
              name: 'Register User',
              password: 'password',
            }),
    },
    {
      label: 'loginUserThunk',
      arg: { email: 'login@example.com', password: 'password' },
      fulfilledUser: createUser({ email: 'login@example.com', name: 'Login User' }),
      pending: (): ReturnType<typeof loginUserThunk.pending> =>
        loginUserThunk.pending('request-id', {
          email: 'login@example.com',
          password: 'password',
        }),
      fulfilled: (): ReturnType<typeof loginUserThunk.fulfilled> =>
        loginUserThunk.fulfilled(
          createUser({ email: 'login@example.com', name: 'Login User' }),
          'request-id',
          { email: 'login@example.com', password: 'password' }
        ),
      rejected: (payload?: string): ReturnType<typeof loginUserThunk.rejected> =>
        payload
          ? loginUserThunk.rejected(
              requestError,
              'request-id',
              { email: 'login@example.com', password: 'password' },
              payload
            )
          : loginUserThunk.rejected(requestError, 'request-id', {
              email: 'login@example.com',
              password: 'password',
            }),
    },
    {
      label: 'updateUserThunk',
      arg: { email: 'updated@example.com', name: 'Updated User', password: 'password' },
      fulfilledUser: createUser({ email: 'updated@example.com', name: 'Updated User' }),
      pending: (): ReturnType<typeof updateUserThunk.pending> =>
        updateUserThunk.pending('request-id', {
          email: 'updated@example.com',
          name: 'Updated User',
          password: 'password',
        }),
      fulfilled: (): ReturnType<typeof updateUserThunk.fulfilled> =>
        updateUserThunk.fulfilled(
          createUser({ email: 'updated@example.com', name: 'Updated User' }),
          'request-id',
          {
            email: 'updated@example.com',
            name: 'Updated User',
            password: 'password',
          }
        ),
      rejected: (payload?: string): ReturnType<typeof updateUserThunk.rejected> =>
        payload
          ? updateUserThunk.rejected(
              requestError,
              'request-id',
              {
                email: 'updated@example.com',
                name: 'Updated User',
                password: 'password',
              },
              payload
            )
          : updateUserThunk.rejected(requestError, 'request-id', {
              email: 'updated@example.com',
              name: 'Updated User',
              password: 'password',
            }),
    },
  ];

  describe.each(authThunkCases)(
    '$label',
    ({ pending, fulfilled, rejected, fulfilledUser }) => {
      it('clears errors and starts loading on pending', () => {
        const state = createState({
          error: 'old error',
          user: createUser(),
        });

        expect(userReducer(state, pending())).toEqual({
          ...state,
          error: null,
          isLoading: true,
        });
      });

      it('stores the returned user and ends loading on fulfilled', () => {
        const state = createState({
          authStatus: 'checking',
          error: 'old error',
          isLoading: true,
          user: createUser(),
        });

        expect(userReducer(state, fulfilled())).toEqual({
          authStatus: 'checked',
          error: 'old error',
          isLoading: false,
          user: fulfilledUser,
        });
      });

      it.each([
        ['a payload error', 'Request rejected'],
        ['a missing payload', null],
      ] as const)('stores %s and ends loading', (_label, payload) => {
        const state = createState({
          authStatus: 'checked',
          error: 'old error',
          isLoading: true,
          user: createUser(),
        });

        expect(userReducer(state, rejected(payload ?? undefined))).toEqual({
          authStatus: 'checked',
          error: payload ?? 'Не удалось выполнить запрос',
          isLoading: false,
          user: state.user,
        });
      });
    }
  );
});
