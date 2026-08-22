import { describe, expect, it } from 'vitest';

import {
  profileFeedClosed,
  profileFeedConnect,
  profileFeedConnecting,
  profileFeedConnectionFailed,
  profileFeedDisconnect,
  profileFeedMessageFailed,
  profileFeedOpened,
  profileFeedSnapshotReceived,
} from '@services/profile-feed/actions';
import { profileFeedReducer } from '@services/profile-feed/slice';
import { logoutUserThunk } from '@services/user/actions';
import { sessionInvalidated } from '@services/user/session';

import type { TFeedState } from '@services/feed/types';
import type { TOrder } from '@utils/order-types';

const createOrder = (id: string): TOrder => ({
  _id: id,
  createdAt: '2026-08-22T00:00:00.000Z',
  ingredients: ['bun-id', 'main-id', 'bun-id'],
  name: `Заказ ${id}`,
  number: 424242,
  status: 'done',
  updatedAt: '2026-08-22T00:01:00.000Z',
});

const createState = (overrides: Partial<TFeedState> = {}): TFeedState => ({
  connectionStatus: 'disconnected',
  error: null,
  hasReceivedSnapshot: false,
  orders: [],
  retryAttempt: 0,
  total: 0,
  totalToday: 0,
  ...overrides,
});

describe('profileFeedReducer', () => {
  it('returns the exact initial state for an unknown action', () => {
    expect(profileFeedReducer(undefined, { type: 'unknown' })).toEqual({
      connectionStatus: 'disconnected',
      error: null,
      hasReceivedSnapshot: false,
      orders: [],
      retryAttempt: 0,
      total: 0,
      totalToday: 0,
    });
  });

  it('connects and clears connection error and retry attempt', () => {
    const state = createState({
      connectionStatus: 'unavailable',
      error: 'connection failed',
      hasReceivedSnapshot: true,
      orders: [createOrder('existing-order')],
      retryAttempt: 4,
      total: 20,
      totalToday: 8,
    });

    expect(profileFeedReducer(state, profileFeedConnect())).toEqual({
      ...state,
      connectionStatus: 'connecting',
      error: null,
      retryAttempt: 0,
    });
  });

  it.each([
    [0, 'connecting'],
    [3, 'retrying'],
  ] as const)(
    'records connecting attempt %d as %s',
    (retryAttempt, connectionStatus) => {
      const state = createState({
        connectionStatus: 'disconnected',
        error: 'previous error',
        orders: [createOrder('existing-order')],
        retryAttempt: 7,
      });

      expect(profileFeedReducer(state, profileFeedConnecting({ retryAttempt }))).toEqual(
        {
          ...state,
          connectionStatus,
          retryAttempt,
        }
      );
    }
  );

  it('opens the connection and clears the error', () => {
    const state = createState({
      connectionStatus: 'retrying',
      error: 'previous error',
      hasReceivedSnapshot: true,
      orders: [createOrder('existing-order')],
      retryAttempt: 2,
      total: 10,
      totalToday: 5,
    });

    expect(profileFeedReducer(state, profileFeedOpened())).toEqual({
      ...state,
      connectionStatus: 'connected',
      error: null,
    });
  });

  it('replaces snapshot data and resets snapshot error and retry state', () => {
    const orders = [createOrder('first-order'), createOrder('second-order')];
    const state = createState({
      connectionStatus: 'retrying',
      error: 'previous error',
      orders: [createOrder('old-order')],
      retryAttempt: 3,
      total: 2,
      totalToday: 1,
    });

    expect(
      profileFeedReducer(
        state,
        profileFeedSnapshotReceived({ orders, success: true, total: 42, totalToday: 7 })
      )
    ).toEqual({
      connectionStatus: 'connected',
      error: null,
      hasReceivedSnapshot: true,
      orders,
      retryAttempt: 0,
      total: 42,
      totalToday: 7,
    });
  });

  it.each([
    ['message failure', profileFeedMessageFailed('message failed')],
    ['connection failure', profileFeedConnectionFailed('connection failed')],
  ])('stores a %s without changing other feed data', (_label, action) => {
    const state = createState({
      connectionStatus: 'connected',
      hasReceivedSnapshot: true,
      orders: [createOrder('existing-order')],
      retryAttempt: 2,
      total: 12,
      totalToday: 6,
    });

    expect(profileFeedReducer(state, action)).toEqual({
      ...state,
      error: action.payload,
    });
  });

  it.each([
    [true, 'retrying'],
    [false, 'unavailable'],
  ] as const)('closes as %s when willRetry is %s', (willRetry, connectionStatus) => {
    const state = createState({
      connectionStatus: 'connected',
      hasReceivedSnapshot: true,
      orders: [createOrder('existing-order')],
      total: 12,
      totalToday: 6,
    });

    expect(
      profileFeedReducer(
        state,
        profileFeedClosed({
          error: 'socket closed',
          retryAttempt: 5,
          willRetry,
        })
      )
    ).toEqual({
      ...state,
      connectionStatus,
      error: 'socket closed',
      retryAttempt: 5,
    });
  });

  const resetActions = [
    { label: 'profileFeedDisconnect', action: profileFeedDisconnect() },
    {
      label: 'logoutUserThunk.pending',
      action: logoutUserThunk.pending('logout-request-id', undefined),
    },
    { label: 'sessionInvalidated', action: sessionInvalidated() },
  ];

  it.each(resetActions)('$label returns a fresh initial state', ({ action }) => {
    const state = createState({
      connectionStatus: 'connected',
      error: 'previous error',
      hasReceivedSnapshot: true,
      orders: [createOrder('existing-order')],
      retryAttempt: 4,
      total: 12,
      totalToday: 6,
    });

    expect(profileFeedReducer(state, action)).toEqual({
      connectionStatus: 'disconnected',
      error: null,
      hasReceivedSnapshot: false,
      orders: [],
      retryAttempt: 0,
      total: 0,
      totalToday: 0,
    });
  });
});
