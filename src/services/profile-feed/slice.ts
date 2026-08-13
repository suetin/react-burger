import { createSelector, createSlice } from '@reduxjs/toolkit';

import { createFeedInitialState } from '@services/feed/types';
import {
  selectIngredients,
  selectIngredientsError,
  selectIngredientsLoading,
} from '@services/ingredients/slice';
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
import { logoutUserThunk } from '@services/user/actions';
import { sessionInvalidated } from '@services/user/session';
import { deriveOrderViewModel } from '@utils/order-format';

import type { TFeedState } from '@services/feed/types';
import type { RootState } from '@services/store';
import type {
  TIngredientCatalogState,
  TOrder,
  TOrderPresentationResult,
} from '@utils/order-types';

export type TProfileFeedState = TFeedState;

const initialState: TProfileFeedState = createFeedInitialState();

const profileFeedSlice = createSlice({
  name: 'profileFeed',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(profileFeedConnect, (state) => {
        state.connectionStatus = 'connecting';
        state.error = null;
        state.retryAttempt = 0;
      })
      .addCase(profileFeedConnecting, (state, action) => {
        state.connectionStatus =
          action.payload.retryAttempt > 0 ? 'retrying' : 'connecting';
        state.retryAttempt = action.payload.retryAttempt;
      })
      .addCase(profileFeedOpened, (state) => {
        state.connectionStatus = 'connected';
        state.error = null;
      })
      .addCase(profileFeedSnapshotReceived, (state, action) => {
        state.connectionStatus = 'connected';
        state.error = null;
        state.hasReceivedSnapshot = true;
        state.orders = action.payload.orders;
        state.retryAttempt = 0;
        state.total = action.payload.total;
        state.totalToday = action.payload.totalToday;
      })
      .addCase(profileFeedMessageFailed, (state, action) => {
        state.error = action.payload;
      })
      .addCase(profileFeedConnectionFailed, (state, action) => {
        state.error = action.payload;
      })
      .addCase(profileFeedClosed, (state, action) => {
        state.connectionStatus = action.payload.willRetry ? 'retrying' : 'unavailable';
        state.error = action.payload.error;
        state.retryAttempt = action.payload.retryAttempt;
      })
      .addCase(profileFeedDisconnect, () => createFeedInitialState())
      .addCase(logoutUserThunk.pending, () => createFeedInitialState())
      .addCase(sessionInvalidated, () => createFeedInitialState());
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

export const profileFeedReducer = profileFeedSlice.reducer;
export const selectProfileFeed = (state: RootState): TProfileFeedState =>
  state.profileFeed;
export const selectProfileFeedOrderById = (
  state: RootState,
  id: string
): TOrder | undefined => state.profileFeed.orders.find((order) => order._id === id);
export const selectProfileFeedOrderPresentations = createSelector(
  [
    (state: RootState): TOrder[] => state.profileFeed.orders,
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
