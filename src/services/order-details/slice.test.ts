import { describe, expect, it } from 'vitest';

import {
  orderDetailsCacheCleared,
  orderDetailsRequestFailed,
  orderDetailsRequestNotFound,
  orderDetailsRequestStarted,
  orderDetailsRequestSucceeded,
} from '@services/order-details/actions';
import {
  orderDetailsReducer,
  type TOrderDetailsEntry,
  type TOrderDetailsState,
} from '@services/order-details/slice';

import type { TOrder } from '@utils/order-types';

const createOrder = (overrides: Partial<TOrder> = {}): TOrder => ({
  _id: 'order-id',
  createdAt: '2026-08-22T00:00:00.000Z',
  ingredients: ['bun-id', 'main-id', 'bun-id'],
  name: 'Флюоресцентный бургер',
  number: 424242,
  status: 'done',
  updatedAt: '2026-08-22T00:01:00.000Z',
  ...overrides,
});

const createEntry = (
  overrides: Partial<TOrderDetailsEntry> = {}
): TOrderDetailsEntry => ({
  canRetry: false,
  currentRequestId: null,
  error: null,
  order: null,
  status: 'idle',
  ...overrides,
});

const createState = (
  id = 'order-id',
  overrides: Partial<TOrderDetailsEntry> = {}
): TOrderDetailsState => ({
  byId: { [id]: createEntry(overrides) },
});

describe('orderDetailsReducer', () => {
  it('returns the exact initial state for an unknown action', () => {
    expect(orderDetailsReducer(undefined, { type: 'unknown' })).toEqual({ byId: {} });
  });

  describe('orderDetailsRequestStarted', () => {
    it.each([
      ['an absent entry', { byId: {} }, 'order-id', 'request-id'],
      ['an idle entry', createState(), 'order-id', 'request-id'],
      [
        'a retryable error entry',
        createState('order-id', {
          canRetry: true,
          error: 'temporary failure',
          status: 'error',
        }),
        'order-id',
        'request-id',
      ],
    ] as const)('%s becomes loading', (_label, state, id, requestId) => {
      expect(
        orderDetailsReducer(state, orderDetailsRequestStarted({ id, requestId }))
      ).toEqual({
        byId: {
          'order-id': createEntry({
            currentRequestId: 'request-id',
            status: 'loading',
          }),
        },
      });
    });

    it.each([
      ['an empty id', { byId: {} }, '', 'request-id'],
      ['a whitespace-only id', { byId: {} }, '   ', 'request-id'],
      ['an empty request id', { byId: {} }, 'order-id', ''],
      ['a whitespace-only request id', { byId: {} }, 'order-id', '   '],
      [
        'an existing loading entry',
        createState('order-id', { status: 'loading' }),
        'order-id',
        'next-request',
      ],
      [
        'an existing not-found entry',
        createState('order-id', { status: 'not-found' }),
        'order-id',
        'next-request',
      ],
      [
        'an existing ready entry',
        createState('order-id', { status: 'ready', order: createOrder() }),
        'order-id',
        'next-request',
      ],
    ] as const)('%s is ignored', (_label, state, id, requestId) => {
      expect(
        orderDetailsReducer(state, orderDetailsRequestStarted({ id, requestId }))
      ).toEqual(state);
    });
  });

  describe('orderDetailsRequestSucceeded', () => {
    it('accepts a matching request and order', () => {
      const order = createOrder();

      expect(
        orderDetailsReducer(
          createState('order-id', {
            canRetry: true,
            currentRequestId: 'request-id',
            error: 'temporary failure',
            status: 'loading',
          }),
          orderDetailsRequestSucceeded({
            id: 'order-id',
            order,
            requestId: 'request-id',
          })
        )
      ).toEqual({
        byId: {
          'order-id': createEntry({ order, status: 'ready' }),
        },
      });
    });

    it.each([
      ['a stale request', 'stale-request', createOrder()],
      ['an order with a different id', 'request-id', createOrder({ _id: 'another-id' })],
    ] as const)('%s is ignored', (_label, requestId, order) => {
      const state = createState('order-id', {
        currentRequestId: 'request-id',
        status: 'loading',
      });

      expect(
        orderDetailsReducer(
          state,
          orderDetailsRequestSucceeded({ id: 'order-id', order, requestId })
        )
      ).toEqual(state);
    });
  });

  describe('orderDetailsRequestNotFound', () => {
    it('accepts a matching request and clears the entry to not-found', () => {
      expect(
        orderDetailsReducer(
          createState('order-id', {
            canRetry: true,
            currentRequestId: 'request-id',
            error: 'old error',
            order: createOrder(),
            status: 'loading',
          }),
          orderDetailsRequestNotFound({ id: 'order-id', requestId: 'request-id' })
        )
      ).toEqual({
        byId: {
          'order-id': createEntry({ status: 'not-found' }),
        },
      });
    });

    it('ignores a stale request', () => {
      const state = createState('order-id', {
        currentRequestId: 'request-id',
        status: 'loading',
      });

      expect(
        orderDetailsReducer(
          state,
          orderDetailsRequestNotFound({ id: 'order-id', requestId: 'stale-request' })
        )
      ).toEqual(state);
    });
  });

  describe('orderDetailsRequestFailed', () => {
    it.each([
      ['retryable error', true, 'Try again later', 'Try again later'],
      ['non-retryable error', false, 'Invalid order response', 'Invalid order response'],
      ['empty error', true, '', 'Не удалось загрузить заказ. Попробуйте позже.'],
      [
        'whitespace-only error',
        false,
        '  \t',
        'Не удалось загрузить заказ. Попробуйте позже.',
      ],
    ] as const)(
      '%s stores the matching failure',
      (_label, canRetry, error, expectedError) => {
        expect(
          orderDetailsReducer(
            createState('order-id', {
              currentRequestId: 'request-id',
              error: 'old error',
              order: createOrder(),
              status: 'loading',
            }),
            orderDetailsRequestFailed({
              canRetry,
              error,
              id: 'order-id',
              requestId: 'request-id',
            })
          )
        ).toEqual({
          byId: {
            'order-id': createEntry({ canRetry, error: expectedError, status: 'error' }),
          },
        });
      }
    );

    it('ignores a stale request', () => {
      const state = createState('order-id', {
        currentRequestId: 'request-id',
        status: 'loading',
      });

      expect(
        orderDetailsReducer(
          state,
          orderDetailsRequestFailed({
            canRetry: true,
            error: 'stale error',
            id: 'order-id',
            requestId: 'stale-request',
          })
        )
      ).toEqual(state);
    });
  });

  it('clears only the requested cache entry', () => {
    const state: TOrderDetailsState = {
      byId: {
        first: createEntry({ status: 'not-found' }),
        second: createEntry({ order: createOrder({ _id: 'second' }), status: 'ready' }),
      },
    };

    expect(orderDetailsReducer(state, orderDetailsCacheCleared('first'))).toEqual({
      byId: {
        second: createEntry({ order: createOrder({ _id: 'second' }), status: 'ready' }),
      },
    });
  });
});
