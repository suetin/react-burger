import { createAction } from '@reduxjs/toolkit';

import type { TFeedClosedPayload, TFeedConnectingPayload } from '@services/feed/types';
import type { TOrdersMessage } from '@utils/order-types';

export const publicFeedConnect = createAction('publicFeed/connect');
export const publicFeedConnecting = createAction<TFeedConnectingPayload>(
  'publicFeed/connecting'
);
export const publicFeedOpened = createAction('publicFeed/opened');
export const publicFeedSnapshotReceived = createAction<TOrdersMessage>(
  'publicFeed/snapshotReceived'
);
export const publicFeedMessageFailed = createAction<string>('publicFeed/messageFailed');
export const publicFeedConnectionFailed = createAction<string>(
  'publicFeed/connectionFailed'
);
export const publicFeedClosed = createAction<TFeedClosedPayload>('publicFeed/closed');
export const publicFeedDisconnect = createAction('publicFeed/disconnect');
