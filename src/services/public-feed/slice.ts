import { createSelector, createSlice } from '@reduxjs/toolkit';

import { createFeedInitialState } from '@services/feed/types';
import {
  selectIngredients,
  selectIngredientsError,
  selectIngredientsLoading,
} from '@services/ingredients/slice';
import {
  publicFeedClosed,
  publicFeedConnect,
  publicFeedConnecting,
  publicFeedConnectionFailed,
  publicFeedDisconnect,
  publicFeedMessageFailed,
  publicFeedOpened,
  publicFeedSnapshotReceived,
} from '@services/public-feed/actions';
import { deriveOrderViewModel } from '@utils/order-format';

import type { TFeedState } from '@services/feed/types';
import type { RootState } from '@services/store';
import type {
  TIngredientCatalogState,
  TOrder,
  TOrderPresentationResult,
} from '@utils/order-types';

export type TPublicFeedState = TFeedState;

const initialState: TPublicFeedState = createFeedInitialState();

const publicFeedSlice = createSlice({
  name: 'publicFeed',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(publicFeedConnect, (state) => {
        state.connectionStatus = 'connecting';
        state.error = null;
        state.retryAttempt = 0;
      })
      .addCase(publicFeedConnecting, (state, action) => {
        state.connectionStatus =
          action.payload.retryAttempt > 0 ? 'retrying' : 'connecting';
        state.retryAttempt = action.payload.retryAttempt;
      })
      .addCase(publicFeedOpened, (state) => {
        state.connectionStatus = 'connected';
        state.error = null;
      })
      .addCase(publicFeedSnapshotReceived, (state, action) => {
        state.connectionStatus = 'connected';
        state.error = null;
        state.hasReceivedSnapshot = true;
        state.orders = action.payload.orders;
        state.retryAttempt = 0;
        state.total = action.payload.total;
        state.totalToday = action.payload.totalToday;
      })
      .addCase(publicFeedMessageFailed, (state, action) => {
        state.error = action.payload;
      })
      .addCase(publicFeedConnectionFailed, (state, action) => {
        state.error = action.payload;
      })
      .addCase(publicFeedClosed, (state, action) => {
        state.connectionStatus = action.payload.willRetry ? 'retrying' : 'unavailable';
        state.error = action.payload.error;
        state.retryAttempt = action.payload.retryAttempt;
      })
      .addCase(publicFeedDisconnect, (state) => {
        state.connectionStatus = 'disconnected';
        state.error = null;
        state.retryAttempt = 0;
      });
  },
});

const selectIngredientCatalogState = (
  _ingredients: ReturnType<typeof selectIngredients>,
  isLoading: boolean,
  error: string | null
): TIngredientCatalogState => {
  if (isLoading) return 'loading';
  return error ? 'error' : 'ready';
};

export const publicFeedReducer = publicFeedSlice.reducer;
export const selectPublicFeed = (state: RootState): TPublicFeedState => state.publicFeed;
export const selectPublicFeedOrderById = (
  state: RootState,
  id: string
): TOrder | undefined => state.publicFeed.orders.find((order) => order._id === id);
export const selectPublicFeedOrderPresentations = createSelector(
  [
    (state: RootState): TOrder[] => state.publicFeed.orders,
    selectIngredients,
    selectIngredientsLoading,
    selectIngredientsError,
  ],
  (orders, ingredients, isLoading, error): TOrderPresentationResult[] => {
    const catalogState = selectIngredientCatalogState(ingredients, isLoading, error);
    return orders
      .map((order) => deriveOrderViewModel(order, ingredients, catalogState))
      .filter((presentation) => presentation.state !== 'unresolvable');
  }
);
