import { createSelector } from '@reduxjs/toolkit';

import { selectOrderDetailsEntry } from '@services/order-details/slice';
import { deriveOrderViewModel } from '@utils/order-format';

import type { TFeedState } from '@services/feed/types';
import type { TIngredientsState } from '@services/ingredients/slice';
import type { TOrderDetailsEntry } from '@services/order-details/slice';
import type { RootState } from '@services/store';
import type { TOrderPresentationResult } from '@utils/order-types';

export type TOrderRouteScope = 'profile' | 'public';

export type TOrderDetailResolution =
  | {
      presentation: TOrderPresentationResult;
      source: 'rest' | 'socket';
      state: 'order';
    }
  | { state: 'loading' }
  | { state: 'not-found' }
  | { canRetry: boolean; state: 'request-error' };

const selectScopedFeed = (state: RootState, scope: TOrderRouteScope): TFeedState =>
  scope === 'profile' ? state.profileFeed : state.publicFeed;

const getCatalogState = (
  ingredientsState: TIngredientsState
): 'error' | 'loading' | 'ready' => {
  if (ingredientsState.isLoading) return 'loading';
  return ingredientsState.error ? 'error' : 'ready';
};

const toPresentation = (
  ingredientsState: TIngredientsState,
  order: NonNullable<ReturnType<typeof selectOrderDetailsEntry>['order']>
): TOrderPresentationResult =>
  deriveOrderViewModel(
    order,
    ingredientsState.ingredients,
    getCatalogState(ingredientsState)
  );

const selectIngredientsState = (state: RootState): TIngredientsState =>
  state.ingredients;
const selectRouteId = (
  _state: RootState,
  _scope: TOrderRouteScope,
  id: string
): string => id;
const selectRouteEntry = (
  state: RootState,
  _scope: TOrderRouteScope,
  id: string
): TOrderDetailsEntry => selectOrderDetailsEntry(state, id);

export const selectOrderDetailResolution = createSelector(
  [selectScopedFeed, selectIngredientsState, selectRouteEntry, selectRouteId],
  (feed, ingredientsState, entry, id): TOrderDetailResolution => {
    const socketOrder = feed.orders.find((order) => order._id === id);

    if (socketOrder) {
      return {
        presentation: toPresentation(ingredientsState, socketOrder),
        source: 'socket',
        state: 'order',
      };
    }

    if (entry.status === 'ready' && entry.order) {
      return {
        presentation: toPresentation(ingredientsState, entry.order),
        source: 'rest',
        state: 'order',
      };
    }
    if (entry.status === 'not-found' || id.trim().length === 0) {
      return { state: 'not-found' };
    }
    if (entry.status === 'error') {
      return { canRetry: entry.canRetry, state: 'request-error' };
    }

    return { state: 'loading' };
  }
);

export const selectShouldRequestOrderDetail = (
  state: RootState,
  scope: TOrderRouteScope,
  id: string
): boolean => {
  if (id.trim().length === 0) return false;

  const feed = selectScopedFeed(state, scope);
  const hasSocketOrder = feed.orders.some((order) => order._id === id);
  const fallbackProven =
    feed.hasReceivedSnapshot || feed.connectionStatus === 'unavailable';

  return (
    !hasSocketOrder &&
    fallbackProven &&
    selectOrderDetailsEntry(state, id).status === 'idle'
  );
};
