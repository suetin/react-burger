import type { Middleware, UnknownAction } from '@reduxjs/toolkit';

export type TSocketParseResult<TMessage> =
  | { data: TMessage; success: true }
  | { error: string; success: false };

export type TSocketConnection = {
  close: () => void;
  onclose: ((event: CloseEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onmessage: ((event: MessageEvent<unknown>) => void) | null;
  onopen: ((event: Event) => void) | null;
  readyState: number;
};

type TPayloadAction<TPayload> = UnknownAction & { payload: TPayload };

type TActionMatcher<TAction extends UnknownAction> = {
  match: (action: unknown) => action is TAction;
};

type TSocketConnectionPolicy<TConnectPayload> = {
  onTerminate?: () => void;
  prepare?: (payload: TConnectPayload) => Promise<void> | void;
  recovery?: {
    matches: (value: unknown) => boolean;
    run: (payload: TConnectPayload) => Promise<void>;
  };
  terminalFailure?: () => UnknownAction;
  terminateActions?: readonly TActionMatcher<UnknownAction>[];
};

type TSocketActions<TConnectPayload, TMessage> = {
  closed: (payload: {
    error: string;
    retryAttempt: number;
    willRetry: boolean;
  }) => UnknownAction;
  connect: TActionMatcher<TPayloadAction<TConnectPayload>>;
  connecting: (payload: { retryAttempt: number }) => UnknownAction;
  connectionFailed: (error: string) => UnknownAction;
  disconnect: TActionMatcher<UnknownAction>;
  messageFailed: (error: string) => UnknownAction;
  messageReceived: (message: TMessage) => UnknownAction;
  opened: () => UnknownAction;
};

export type TSocketMiddlewareConfig<TConnectPayload, TMessage> = {
  actions: TSocketActions<TConnectPayload, TMessage>;
  connectionPolicy?: TSocketConnectionPolicy<TConnectPayload>;
  createSocket?: (url: string) => TSocketConnection;
  getUrl: (payload: TConnectPayload) => string;
  parseMessage: (value: unknown) => TSocketParseResult<TMessage>;
};

const RETRY_DELAYS = [1_000, 2_000, 4_000] as const;
const SOCKET_CLOSING = 2;
const CONNECTION_ERROR = 'WebSocket connection error';
const CONNECTION_PREPARATION_ERROR = 'WebSocket connection preparation failed';
const CONNECTION_RECOVERY_ERROR = 'WebSocket connection recovery failed';

const defaultCreateSocket = (url: string): TSocketConnection => new WebSocket(url);

const getCloseError = (code: number): string => `WebSocket connection closed (${code})`;

export const createSocketMiddleware = <TConnectPayload, TMessage>({
  actions,
  connectionPolicy,
  createSocket = defaultCreateSocket,
  getUrl,
  parseMessage,
}: TSocketMiddlewareConfig<TConnectPayload, TMessage>): Middleware => {
  let generation = 0;
  let retryAttempt = 0;
  let retryTimer: ReturnType<typeof globalThis.setTimeout> | null = null;
  let recoveryAttempted = false;
  let shouldConnect = false;
  let socket: TSocketConnection | null = null;

  const clearRetry = (): void => {
    if (retryTimer !== null) {
      globalThis.clearTimeout(retryTimer);
      retryTimer = null;
    }
  };

  const detachSocket = (target: TSocketConnection): void => {
    target.onclose = null;
    target.onerror = null;
    target.onmessage = null;
    target.onopen = null;
  };

  const closeCurrentSocket = (): void => {
    const target = socket;
    socket = null;

    if (target === null) return;

    detachSocket(target);
    if (target.readyState >= SOCKET_CLOSING) return;

    try {
      target.close();
    } catch {
      // The generation is already invalidated, so a close failure is inert.
    }
  };

  const terminateConnection = (): void => {
    shouldConnect = false;
    retryAttempt = 0;
    generation += 1;
    clearRetry();
    closeCurrentSocket();
    connectionPolicy?.onTerminate?.();
  };

  return (api) => {
    const failTerminally = (error: string, currentGeneration: number): void => {
      if (!shouldConnect || currentGeneration !== generation) return;

      terminateConnection();
      api.dispatch(actions.connectionFailed(error));
      if (connectionPolicy?.terminalFailure) {
        api.dispatch(connectionPolicy.terminalFailure());
      }
    };

    const scheduleRetry = (
      error: string,
      currentGeneration: number,
      payload: TConnectPayload,
      startConnection: (connectPayload: TConnectPayload, attempt: number) => void
    ): void => {
      if (!shouldConnect || currentGeneration !== generation) return;

      if (retryAttempt >= RETRY_DELAYS.length) {
        api.dispatch(actions.closed({ error, retryAttempt, willRetry: false }));
        return;
      }

      retryAttempt += 1;
      const delay = RETRY_DELAYS[retryAttempt - 1];
      api.dispatch(actions.closed({ error, retryAttempt, willRetry: true }));
      retryTimer = globalThis.setTimeout((): void => {
        retryTimer = null;
        if (!shouldConnect || currentGeneration !== generation) return;
        startConnection(payload, retryAttempt);
      }, delay);
    };

    const startConnection = (payload: TConnectPayload, attempt: number): void => {
      clearRetry();
      generation += 1;
      const currentGeneration = generation;
      closeCurrentSocket();
      api.dispatch(actions.connecting({ retryAttempt: attempt }));

      const openSocket = (): void => {
        if (!shouldConnect || currentGeneration !== generation) return;

        let target: TSocketConnection;
        try {
          target = createSocket(getUrl(payload));
        } catch {
          api.dispatch(actions.connectionFailed(CONNECTION_ERROR));
          return;
        }

        socket = target;
        const isCurrent = (): boolean =>
          shouldConnect && currentGeneration === generation && socket === target;

        target.onopen = (): void => {
          if (!isCurrent()) return;
          api.dispatch(actions.opened());
        };

        target.onmessage = (event): void => {
          if (!isCurrent()) return;

          if (connectionPolicy?.recovery?.matches(event.data)) {
            if (recoveryAttempted) {
              failTerminally(CONNECTION_RECOVERY_ERROR, currentGeneration);
              return;
            }

            recoveryAttempted = true;
            retryAttempt = 0;
            generation += 1;
            const recoveryGeneration = generation;
            clearRetry();
            closeCurrentSocket();

            let recovery: Promise<void>;
            try {
              recovery = connectionPolicy.recovery.run(payload);
            } catch {
              failTerminally(CONNECTION_RECOVERY_ERROR, recoveryGeneration);
              return;
            }

            void recovery.then(
              () => {
                if (!shouldConnect || recoveryGeneration !== generation) return;
                startConnection(payload, 0);
              },
              () => failTerminally(CONNECTION_RECOVERY_ERROR, recoveryGeneration)
            );
            return;
          }

          let result: TSocketParseResult<TMessage>;
          try {
            result = parseMessage(event.data);
          } catch {
            result = { error: 'Invalid WebSocket message', success: false };
          }

          if (!isCurrent()) return;
          if (!result.success) {
            api.dispatch(actions.messageFailed(result.error));
            return;
          }

          retryAttempt = 0;
          api.dispatch(actions.messageReceived(result.data));
        };

        target.onerror = (): void => {
          if (!isCurrent()) return;
          api.dispatch(actions.connectionFailed(CONNECTION_ERROR));

          if (target.readyState < SOCKET_CLOSING) {
            try {
              target.close();
            } catch {
              // A close event is the only signal allowed to schedule reconnection.
            }
          }
        };

        target.onclose = (event): void => {
          if (!isCurrent()) return;
          socket = null;
          detachSocket(target);
          const error = getCloseError(event.code);

          if (event.code === 1000 || event.wasClean) {
            api.dispatch(actions.closed({ error, retryAttempt, willRetry: false }));
            return;
          }

          scheduleRetry(error, currentGeneration, payload, startConnection);
        };
      };

      let preparation: Promise<void> | void;
      try {
        preparation = connectionPolicy?.prepare?.(payload);
      } catch {
        failTerminally(CONNECTION_PREPARATION_ERROR, currentGeneration);
        return;
      }

      if (preparation) {
        void preparation.then(openSocket, () =>
          failTerminally(CONNECTION_PREPARATION_ERROR, currentGeneration)
        );
        return;
      }

      openSocket();
    };

    return (next) =>
      (action): unknown => {
        const result = next(action);

        if (actions.connect.match(action)) {
          shouldConnect = true;
          retryAttempt = 0;
          recoveryAttempted = false;
          startConnection(action.payload, retryAttempt);
        } else if (
          actions.disconnect.match(action) ||
          connectionPolicy?.terminateActions?.some((matcher) => matcher.match(action))
        ) {
          terminateConnection();
        }

        return result;
      };
  };
};
