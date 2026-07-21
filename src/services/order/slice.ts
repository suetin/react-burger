import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { createOrder } from '@utils/api';

import type { RootState } from '@services/store';

export const createOrderThunk = createAsyncThunk<number, string[]>(
  'order/createOrder',
  createOrder
);

export type TOrderState = {
  currentRequestId: string | null;
  error: string | null;
  isLoading: boolean;
  isOpen: boolean;
  orderNumber: number | null;
};

const initialState: TOrderState = {
  currentRequestId: null,
  error: null,
  isLoading: false,
  isOpen: false,
  orderNumber: null,
};

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    clearOrder: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOrderThunk.pending, (state, action) => {
        state.currentRequestId = action.meta.requestId;
        state.error = null;
        state.isLoading = true;
        state.isOpen = true;
        state.orderNumber = null;
      })
      .addCase(createOrderThunk.fulfilled, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) return;
        state.currentRequestId = null;
        state.isLoading = false;
        state.orderNumber = action.payload;
      })
      .addCase(createOrderThunk.rejected, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) return;
        state.currentRequestId = null;
        state.error = 'Не удалось оформить заказ. Попробуйте позже.';
        state.isLoading = false;
      });
  },
});

export const { clearOrder } = orderSlice.actions;
export const orderReducer = orderSlice.reducer;
export const selectOrderError = (state: RootState): string | null => state.order.error;
export const selectOrderLoading = (state: RootState): boolean => state.order.isLoading;
export const selectOrderNumber = (state: RootState): number | null =>
  state.order.orderNumber;
export const selectOrderOpen = (state: RootState): boolean => state.order.isOpen;
