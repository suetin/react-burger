import { createAction } from '@reduxjs/toolkit';

import type { TFeedClosedPayload, TFeedConnectingPayload } from '@services/feed/types';
import type { TOrdersMessage } from '@utils/order-types';

export const profileFeedConnect = createAction('profileFeed/connect');
export const profileFeedConnecting = createAction<TFeedConnectingPayload>(
  'profileFeed/connecting'
);
export const profileFeedOpened = createAction('profileFeed/opened');
export const profileFeedSnapshotReceived = createAction<TOrdersMessage>(
  'profileFeed/snapshotReceived'
);
export const profileFeedMessageFailed = createAction<string>(
  'profileFeed/messageFailed'
);
export const profileFeedConnectionFailed = createAction<string>(
  'profileFeed/connectionFailed'
);
export const profileFeedClosed = createAction<TFeedClosedPayload>('profileFeed/closed');
export const profileFeedDisconnect = createAction('profileFeed/disconnect');
