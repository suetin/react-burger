import { createAction, nanoid } from '@reduxjs/toolkit';

import { ApiError, getOrderById, OrderNotFoundError } from '@utils/api';

import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import type { RootState } from '@services/store';
import type { TOrder } from '@utils/order-types';

type TOrderDetailsRequestPayload = {
  id: string;
  requestId: string;
};

type TOrderDetailsFailurePayload = TOrderDetailsRequestPayload & {
  canRetry: boolean;
  error: string;
};

type TOrderDetailsSuccessPayload = TOrderDetailsRequestPayload & {
  order: TOrder;
};

export const orderDetailsRequestStarted = createAction<TOrderDetailsRequestPayload>(
  'orderDetails/requestStarted'
);
export const orderDetailsRequestSucceeded = createAction<TOrderDetailsSuccessPayload>(
  'orderDetails/requestSucceeded'
);
export const orderDetailsRequestNotFound = createAction<TOrderDetailsRequestPayload>(
  'orderDetails/requestNotFound'
);
export const orderDetailsRequestFailed = createAction<TOrderDetailsFailurePayload>(
  'orderDetails/requestFailed'
);
export const orderDetailsCacheCleared = createAction<string>(
  'orderDetails/cacheCleared'
);

type TOrderDetailsThunk = ThunkAction<Promise<void>, RootState, unknown, UnknownAction>;

const isNotFoundError = (error: unknown): boolean =>
  error instanceof OrderNotFoundError ||
  (error instanceof ApiError && error.status === 404);

const isTransientError = (error: unknown): boolean => {
  if (!(error instanceof ApiError)) return true;
  if (
    error.message === 'Invalid order response' ||
    error.message === 'Order id is missing'
  ) {
    return false;
  }
  return (
    error.status === 0 ||
    error.status === 200 ||
    error.status === 408 ||
    error.status === 429 ||
    error.status >= 500
  );
};

export const fetchOrderDetails =
  (id: string, { retry = false }: { retry?: boolean } = {}): TOrderDetailsThunk =>
  async (dispatch, getState): Promise<void> => {
    if (id.trim().length === 0) return;

    const entry = getState().orderDetails.byId[id];
    const canStart =
      !entry ||
      entry.status === 'idle' ||
      (retry && entry.status === 'error' && entry.canRetry);

    if (!canStart) return;

    const requestId = nanoid();
    dispatch(orderDetailsRequestStarted({ id, requestId }));

    try {
      const order = await getOrderById(id);
      dispatch(orderDetailsRequestSucceeded({ id, order, requestId }));
    } catch (error) {
      if (isNotFoundError(error)) {
        dispatch(orderDetailsRequestNotFound({ id, requestId }));
        return;
      }

      const canRetry = isTransientError(error);
      dispatch(
        orderDetailsRequestFailed({
          canRetry,
          error: canRetry
            ? 'Не удалось загрузить заказ. Попробуйте ещё раз.'
            : 'Не удалось получить данные заказа.',
          id,
          requestId,
        })
      );
    }
  };
