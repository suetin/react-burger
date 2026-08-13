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
import { createSocketMiddleware } from '@services/socket/create-socket-middleware';
import { logoutUserThunk } from '@services/user/actions';
import { sessionInvalidated } from '@services/user/session';
import { getRefreshedTokens } from '@utils/api';
import { isInvalidTokenMessage, parseOrdersMessage } from '@utils/order-validation';
import { getAccessToken } from '@utils/token-storage';

import type { Middleware } from '@reduxjs/toolkit';
import type { TSocketConnection } from '@services/socket/create-socket-middleware';
import type { TOrdersMessage } from '@utils/order-types';
import type { TTokenResponse } from '@utils/types';

export const PUBLIC_FEED_SOCKET_URL =
  'wss://new-stellarburgers.education-services.ru/orders/all';
export const PROFILE_FEED_SOCKET_URL =
  'wss://new-stellarburgers.education-services.ru/orders';

type TProfileFeedMiddlewareDependencies = {
  createSocket?: (url: string) => TSocketConnection;
  refreshTokens?: () => Promise<TTokenResponse>;
};

const getNormalizedAccessToken = (): string | null => {
  const token = getAccessToken()?.trim();
  return token && token !== 'Bearer' ? token : null;
};

export const buildProfileFeedSocketUrl = (accessToken: string): string => {
  const normalized = accessToken.trim();
  const rawToken = normalized.startsWith('Bearer ')
    ? normalized.slice('Bearer '.length).trim()
    : normalized;

  if (rawToken.length === 0 || rawToken === 'Bearer') {
    throw new Error('Access token is missing');
  }

  return `${PROFILE_FEED_SOCKET_URL}?token=${encodeURIComponent(rawToken)}`;
};

export const publicFeedMiddleware = createSocketMiddleware<undefined, TOrdersMessage>({
  actions: {
    closed: publicFeedClosed,
    connect: publicFeedConnect,
    connecting: publicFeedConnecting,
    connectionFailed: publicFeedConnectionFailed,
    disconnect: publicFeedDisconnect,
    messageFailed: publicFeedMessageFailed,
    messageReceived: publicFeedSnapshotReceived,
    opened: publicFeedOpened,
  },
  getUrl: (): string => PUBLIC_FEED_SOCKET_URL,
  parseMessage: parseOrdersMessage,
});

export const createProfileFeedMiddleware = ({
  createSocket,
  refreshTokens = getRefreshedTokens,
}: TProfileFeedMiddlewareDependencies = {}): Middleware => {
  let accessTokenUsed: string | null = null;

  const prepareConnection = (): Promise<void> | void => {
    if (getNormalizedAccessToken()) return;

    return refreshTokens().then(() => {
      if (!getNormalizedAccessToken()) {
        throw new Error('Access token is missing');
      }
    });
  };

  return createSocketMiddleware<undefined, TOrdersMessage>({
    actions: {
      closed: profileFeedClosed,
      connect: profileFeedConnect,
      connecting: profileFeedConnecting,
      connectionFailed: profileFeedConnectionFailed,
      disconnect: profileFeedDisconnect,
      messageFailed: profileFeedMessageFailed,
      messageReceived: profileFeedSnapshotReceived,
      opened: profileFeedOpened,
    },
    connectionPolicy: {
      prepare: prepareConnection,
      recovery: {
        matches: isInvalidTokenMessage,
        run: () => {
          const currentToken = getNormalizedAccessToken();
          if (currentToken && currentToken !== accessTokenUsed) {
            return Promise.resolve();
          }

          return refreshTokens().then(() => undefined);
        },
      },
      terminalFailure: sessionInvalidated,
      terminateActions: [logoutUserThunk.pending, sessionInvalidated],
    },
    createSocket,
    getUrl: (): string => {
      const accessToken = getNormalizedAccessToken();
      if (!accessToken) throw new Error('Access token is missing');

      accessTokenUsed = accessToken;
      return buildProfileFeedSocketUrl(accessToken);
    },
    parseMessage: parseOrdersMessage,
  });
};

export const profileFeedMiddleware = createProfileFeedMiddleware();
