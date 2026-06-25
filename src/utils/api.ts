import { API_BASE_URL, INGREDIENTS_ENDPOINT, ORDERS_ENDPOINT } from '@utils/constants';

import type { TCreateOrderResponse, TIngredient } from '@utils/types';

type TIngredientsResponse = {
  success: boolean;
  data: TIngredient[];
};

type TApiResponse = {
  success: boolean;
};

const getError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error;
  }

  return new Error(JSON.stringify(error));
};

const getResponseError = (response: Response): Promise<Error> => {
  return response
    .json()
    .then((error: unknown) => getError(error))
    .catch(() => new Error(`Request failed: ${response.status}`));
};

const checkResponse = <T>(response: Response): Promise<T> => {
  if (response.ok) {
    return response.json() as Promise<T>;
  }

  return getResponseError(response).then((error) => Promise.reject(error));
};

const checkSuccess = <T extends TApiResponse>(response: T): T => {
  if (response.success) {
    return response;
  }

  throw new Error('Ответ сервера не success');
};

const request = <T extends TApiResponse>(
  endpoint: string,
  options?: RequestInit
): Promise<T> => {
  return fetch(`${API_BASE_URL}/${endpoint}`, options)
    .then((response) => checkResponse<T>(response))
    .then(checkSuccess)
    .catch((error: unknown) => Promise.reject(getError(error)));
};

export const getIngredients = (): Promise<TIngredient[]> => {
  return request<TIngredientsResponse>(INGREDIENTS_ENDPOINT).then(
    (response) => response.data
  );
};

export const createOrder = (ingredientIds: string[]): Promise<number> => {
  return request<TCreateOrderResponse>(ORDERS_ENDPOINT, {
    body: JSON.stringify({ ingredients: ingredientIds }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  }).then((response) => response.order.number);
};
