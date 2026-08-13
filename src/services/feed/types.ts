import type { TOrder } from '@utils/order-types';

export type TFeedConnectionStatus =
  | 'connected'
  | 'connecting'
  | 'disconnected'
  | 'retrying'
  | 'unavailable';

export type TFeedClosedPayload = {
  error: string;
  retryAttempt: number;
  willRetry: boolean;
};

export type TFeedConnectingPayload = {
  retryAttempt: number;
};

export type TFeedState = {
  connectionStatus: TFeedConnectionStatus;
  error: string | null;
  hasReceivedSnapshot: boolean;
  orders: TOrder[];
  retryAttempt: number;
  total: number;
  totalToday: number;
};

export const createFeedInitialState = (): TFeedState => ({
  connectionStatus: 'disconnected',
  error: null,
  hasReceivedSnapshot: false,
  orders: [],
  retryAttempt: 0,
  total: 0,
  totalToday: 0,
});
