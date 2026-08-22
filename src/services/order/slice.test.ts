import { describe, expect, it } from 'vitest';

import { createOrderThunk } from '@services/order/actions';
import { clearOrder, orderReducer, type TOrderState } from '@services/order/slice';

const initialState: TOrderState = {
  currentRequestId: null,
  error: null,
  isLoading: false,
  isOpen: false,
  orderNumber: null,
};

describe('orderReducer', () => {
  it('returns the exact initial state for undefined and unknown actions', () => {
    expect(orderReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('handles pending by opening the modal and tracking the request', () => {
    const state: TOrderState = {
      currentRequestId: 'old-request',
      error: 'Старая ошибка',
      isLoading: false,
      isOpen: false,
      orderNumber: 123,
    };

    expect(
      orderReducer(state, createOrderThunk.pending('request-id', ['ingredient-id']))
    ).toEqual({
      currentRequestId: 'request-id',
      error: null,
      isLoading: true,
      isOpen: true,
      orderNumber: null,
    });
  });

  it('handles a matching fulfilled request', () => {
    const pendingState = orderReducer(
      initialState,
      createOrderThunk.pending('request-id', ['ingredient-id'])
    );

    expect(
      orderReducer(
        pendingState,
        createOrderThunk.fulfilled(9876, 'request-id', ['ingredient-id'])
      )
    ).toEqual({
      currentRequestId: null,
      error: null,
      isLoading: false,
      isOpen: true,
      orderNumber: 9876,
    });
  });

  it('ignores a stale fulfilled request', () => {
    const state = orderReducer(
      initialState,
      createOrderThunk.pending('current-request', ['current-ingredient'])
    );

    expect(
      orderReducer(
        state,
        createOrderThunk.fulfilled(9876, 'stale-request', ['stale-ingredient'])
      )
    ).toEqual(state);
  });

  it('handles a matching rejected request with the exact error', () => {
    const pendingState = orderReducer(
      initialState,
      createOrderThunk.pending('request-id', ['ingredient-id'])
    );

    expect(
      orderReducer(
        pendingState,
        createOrderThunk.rejected(new Error('network error'), 'request-id', [
          'ingredient-id',
        ])
      )
    ).toEqual({
      currentRequestId: null,
      error: 'Не удалось оформить заказ. Попробуйте позже.',
      isLoading: false,
      isOpen: true,
      orderNumber: null,
    });
  });

  it('ignores a stale rejected request', () => {
    const state = orderReducer(
      initialState,
      createOrderThunk.pending('current-request', ['current-ingredient'])
    );

    expect(
      orderReducer(
        state,
        createOrderThunk.rejected(new Error('stale error'), 'stale-request', [
          'stale-ingredient',
        ])
      )
    ).toEqual(state);
  });

  it('clears all order state to the exact initial state', () => {
    const pendingState = orderReducer(
      initialState,
      createOrderThunk.pending('request-id', ['ingredient-id'])
    );

    expect(orderReducer(pendingState, clearOrder())).toEqual(initialState);
  });
});
