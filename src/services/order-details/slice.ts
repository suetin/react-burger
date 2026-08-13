import { createSlice } from '@reduxjs/toolkit';

import {
  orderDetailsCacheCleared,
  orderDetailsRequestFailed,
  orderDetailsRequestNotFound,
  orderDetailsRequestStarted,
  orderDetailsRequestSucceeded,
} from '@services/order-details/actions';

import type { RootState } from '@services/store';
import type { TOrder } from '@utils/order-types';

export type TOrderDetailsStatus = 'error' | 'idle' | 'loading' | 'not-found' | 'ready';

export type TOrderDetailsEntry = {
  canRetry: boolean;
  currentRequestId: string | null;
  error: string | null;
  order: TOrder | null;
  status: TOrderDetailsStatus;
};

export type TOrderDetailsState = {
  byId: Record<string, TOrderDetailsEntry>;
};

const emptyEntry: TOrderDetailsEntry = {
  canRetry: false,
  currentRequestId: null,
  error: null,
  order: null,
  status: 'idle',
};

const initialState: TOrderDetailsState = {
  byId: {},
};

const isBlank = (value: string): boolean => value.trim().length === 0;

const orderDetailsSlice = createSlice({
  name: 'orderDetails',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(orderDetailsRequestStarted, (state, action) => {
        const { id, requestId } = action.payload;
        const entry = state.byId[id];

        if (
          isBlank(id) ||
          isBlank(requestId) ||
          entry?.status === 'loading' ||
          entry?.status === 'not-found' ||
          entry?.status === 'ready'
        ) {
          return;
        }

        state.byId[id] = {
          canRetry: false,
          currentRequestId: requestId,
          error: null,
          order: null,
          status: 'loading',
        };
      })
      .addCase(orderDetailsRequestSucceeded, (state, action) => {
        const { id, order, requestId } = action.payload;
        const entry = state.byId[id];

        if (entry?.currentRequestId !== requestId || order._id !== id) return;

        entry.currentRequestId = null;
        entry.canRetry = false;
        entry.error = null;
        entry.order = order;
        entry.status = 'ready';
      })
      .addCase(orderDetailsRequestNotFound, (state, action) => {
        const { id, requestId } = action.payload;
        const entry = state.byId[id];

        if (entry?.currentRequestId !== requestId) return;

        entry.currentRequestId = null;
        entry.canRetry = false;
        entry.error = null;
        entry.order = null;
        entry.status = 'not-found';
      })
      .addCase(orderDetailsRequestFailed, (state, action) => {
        const { canRetry, error, id, requestId } = action.payload;
        const entry = state.byId[id];

        if (entry?.currentRequestId !== requestId) return;

        entry.currentRequestId = null;
        entry.canRetry = canRetry;
        entry.error = isBlank(error)
          ? 'Не удалось загрузить заказ. Попробуйте позже.'
          : error;
        entry.order = null;
        entry.status = 'error';
      })
      .addCase(orderDetailsCacheCleared, (state, action) => {
        delete state.byId[action.payload];
      });
  },
});

export const orderDetailsReducer = orderDetailsSlice.reducer;
export const selectOrderDetailsEntry = (
  state: RootState,
  id: string
): TOrderDetailsEntry => state.orderDetails.byId[id] ?? emptyEntry;
export const selectOrderDetailsOrder = (state: RootState, id: string): TOrder | null =>
  selectOrderDetailsEntry(state, id).order;
export const selectOrderDetailsLoading = (state: RootState, id: string): boolean =>
  selectOrderDetailsEntry(state, id).status === 'loading';
export const selectOrderDetailsError = (state: RootState, id: string): string | null =>
  selectOrderDetailsEntry(state, id).error;
export const selectOrderDetailsCanRetry = (state: RootState, id: string): boolean =>
  selectOrderDetailsEntry(state, id).status === 'error' &&
  selectOrderDetailsEntry(state, id).canRetry;
export const selectShouldFetchOrderDetails = (state: RootState, id: string): boolean => {
  const { status } = selectOrderDetailsEntry(state, id);
  return !isBlank(id) && (status === 'idle' || status === 'error');
};
