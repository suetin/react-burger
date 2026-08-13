import {
  API_BASE_URL,
  INGREDIENTS_ENDPOINT,
  LOGIN_ENDPOINT,
  LOGOUT_ENDPOINT,
  ORDERS_ENDPOINT,
  PASSWORD_RESET_CONFIRM_ENDPOINT,
  PASSWORD_RESET_ENDPOINT,
  REGISTER_ENDPOINT,
  TOKEN_ENDPOINT,
  USER_ENDPOINT,
} from '@utils/constants';
import { parseOrderResponse } from '@utils/order-validation';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  getTokenStorageRevision,
  setTokens,
} from '@utils/token-storage';

import type { TOrder, TOrderResponse } from '@utils/order-types';
import type {
  TAuthResponse,
  TCreateOrderResponse,
  TIngredient,
  TLoginData,
  TMessageResponse,
  TRegisterData,
  TTokenResponse,
  TUpdateUserData,
  TUserResponse,
} from '@utils/types';

type TApiResponse = { success: boolean };
type TIngredientsResponse = TApiResponse & { data: TIngredient[] };

export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export class SessionInvalidatedError extends ApiError {
  constructor() {
    super('Session is invalid');
    this.name = 'SessionInvalidatedError';
  }
}

export class OrderNotFoundError extends ApiError {
  constructor() {
    super('Order not found', 404);
    this.name = 'OrderNotFoundError';
  }
}

const toApiError = (error: unknown, status = 0): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }
  if (error instanceof Error) {
    return new ApiError(error.message, status);
  }
  if (typeof error === 'object' && error && 'message' in error) {
    return new ApiError(String(error.message), status);
  }
  return new ApiError('Неизвестная ошибка запроса', status);
};

export const isTokenExpiredError = (error: unknown): boolean => {
  return error instanceof ApiError && error.message === 'jwt expired';
};

export const isSessionInvalidatedError = (
  error: unknown
): error is SessionInvalidatedError => error instanceof SessionInvalidatedError;

const checkResponse = async <T extends TApiResponse>(response: Response): Promise<T> => {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ApiError(`Request failed: ${response.status}`, response.status);
  }

  if (!response.ok) {
    throw toApiError(body, response.status);
  }
  if (!body || typeof body !== 'object' || !('success' in body) || !body.success) {
    throw toApiError(body, response.status);
  }
  return body as T;
};

export const request = async <T extends TApiResponse>(
  endpoint: string,
  options?: RequestInit
): Promise<T> => {
  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, options);
    return await checkResponse<T>(response);
  } catch (error) {
    throw toApiError(error);
  }
};

type TRefreshFlight = {
  promise: Promise<TTokenResponse>;
  revision: number;
};

let refreshFlight: TRefreshFlight | null = null;

const isNonBlankToken = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const hasUsableAccessToken = (value: unknown): value is string => {
  if (!isNonBlankToken(value)) return false;

  const normalized = value.trim();
  return (
    normalized !== 'Bearer' &&
    (!normalized.startsWith('Bearer ') ||
      normalized.slice('Bearer '.length).trim().length > 0)
  );
};

const refreshToken = async (revision: number): Promise<TTokenResponse> => {
  const token = getRefreshToken();
  if (!isNonBlankToken(token)) {
    clearTokens();
    throw new SessionInvalidatedError();
  }

  try {
    const response = await request<TTokenResponse>(TOKEN_ENDPOINT, {
      body: JSON.stringify({ token }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });

    if (
      !hasUsableAccessToken(response.accessToken) ||
      !isNonBlankToken(response.refreshToken) ||
      getTokenStorageRevision() !== revision
    ) {
      throw new SessionInvalidatedError();
    }

    setTokens(response.accessToken, response.refreshToken);
    return response;
  } catch {
    if (getTokenStorageRevision() === revision) {
      clearTokens();
    }
    throw new SessionInvalidatedError();
  }
};

export const getRefreshedTokens = (): Promise<TTokenResponse> => {
  const revision = getTokenStorageRevision();
  if (refreshFlight?.revision === revision) return refreshFlight.promise;

  const promise = refreshToken(revision).finally(() => {
    if (refreshFlight?.promise === promise) {
      refreshFlight = null;
    }
  });
  refreshFlight = { promise, revision };
  return promise;
};

export const fetchWithRefresh = async <T extends TApiResponse>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const tokenUsed = getAccessToken();
  const run = (token: string | null): Promise<T> => {
    const headers = new Headers(options.headers);
    if (token) {
      headers.set('authorization', token);
    }
    return request<T>(endpoint, { ...options, headers });
  };

  try {
    return await run(tokenUsed);
  } catch (error) {
    if (!isTokenExpiredError(error)) {
      throw error;
    }

    const currentToken = getAccessToken();
    if (currentToken && currentToken !== tokenUsed) {
      try {
        return await run(currentToken);
      } catch (replayError) {
        if (isTokenExpiredError(replayError)) {
          clearTokens();
          throw new SessionInvalidatedError();
        }
        throw replayError;
      }
    }

    const tokens = await getRefreshedTokens();
    try {
      return await run(tokens.accessToken);
    } catch (replayError) {
      if (isTokenExpiredError(replayError)) {
        clearTokens();
        throw new SessionInvalidatedError();
      }
      throw replayError;
    }
  }
};

const jsonOptions = (method: string, body: unknown): RequestInit => ({
  body: JSON.stringify(body),
  headers: { 'Content-Type': 'application/json' },
  method,
});

export const getIngredients = async (): Promise<TIngredient[]> => {
  const response = await request<TIngredientsResponse>(INGREDIENTS_ENDPOINT);
  return response.data;
};

export const createOrder = async (ingredientIds: string[]): Promise<number> => {
  const response = await fetchWithRefresh<TCreateOrderResponse>(
    ORDERS_ENDPOINT,
    jsonOptions('POST', { ingredients: ingredientIds })
  );
  return response.order.number;
};

export const getOrderById = async (id: string): Promise<TOrder> => {
  if (id.trim().length === 0) {
    throw new ApiError('Order id is missing');
  }

  const response = await request<TOrderResponse>(
    `${ORDERS_ENDPOINT}/${encodeURIComponent(id)}`,
    { method: 'GET' }
  );
  const result = parseOrderResponse(response);

  if (!result.success) {
    throw new ApiError(result.error);
  }
  if (result.data.order._id !== id) {
    throw new ApiError('Invalid order response');
  }

  return result.data.order;
};

export const registerUser = (data: TRegisterData): Promise<TAuthResponse> => {
  return request<TAuthResponse>(REGISTER_ENDPOINT, jsonOptions('POST', data));
};

export const loginUser = (data: TLoginData): Promise<TAuthResponse> => {
  return request<TAuthResponse>(LOGIN_ENDPOINT, jsonOptions('POST', data));
};

export const logoutUser = (token: string): Promise<TMessageResponse> => {
  return request<TMessageResponse>(LOGOUT_ENDPOINT, jsonOptions('POST', { token }));
};

export const getUser = (): Promise<TUserResponse> => {
  return fetchWithRefresh<TUserResponse>(USER_ENDPOINT);
};

export const updateUser = (data: TUpdateUserData): Promise<TUserResponse> => {
  return fetchWithRefresh<TUserResponse>(USER_ENDPOINT, jsonOptions('PATCH', data));
};

export const forgotPassword = (email: string): Promise<TMessageResponse> => {
  return request<TMessageResponse>(
    PASSWORD_RESET_ENDPOINT,
    jsonOptions('POST', { email })
  );
};

export const resetPassword = (
  password: string,
  token: string
): Promise<TMessageResponse> => {
  return request<TMessageResponse>(
    PASSWORD_RESET_CONFIRM_ENDPOINT,
    jsonOptions('POST', { password, token })
  );
};
