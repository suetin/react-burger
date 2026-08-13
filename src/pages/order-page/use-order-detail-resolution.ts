import { useCallback, useEffect } from 'react';

import { useAppDispatch, useAppSelector } from '@services/hooks';
import { fetchOrderDetails } from '@services/order-details/actions';
import {
  selectOrderDetailResolution,
  selectShouldRequestOrderDetail,
} from '@services/order-details/selectors';

import type {
  TOrderDetailResolution,
  TOrderRouteScope,
} from '@services/order-details/selectors';

export const useOrderDetailResolution = (
  scope: TOrderRouteScope,
  id: string
): { resolution: TOrderDetailResolution; retry: () => void } => {
  const dispatch = useAppDispatch();
  const resolution = useAppSelector((state) =>
    selectOrderDetailResolution(state, scope, id)
  );
  const shouldRequest = useAppSelector((state) =>
    selectShouldRequestOrderDetail(state, scope, id)
  );

  useEffect(() => {
    if (shouldRequest) {
      void dispatch(fetchOrderDetails(id));
    }
  }, [dispatch, id, shouldRequest]);

  const retry = useCallback((): void => {
    if (resolution.state === 'request-error' && resolution.canRetry) {
      void dispatch(fetchOrderDetails(id, { retry: true }));
    }
  }, [dispatch, id, resolution]);

  return { resolution, retry };
};
