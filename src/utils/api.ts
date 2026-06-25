import { INGREDIENTS_ENDPOINT, ORDERS_ENDPOINT } from '@utils/constants';

import type { TCreateOrderResponse, TIngredient } from '@utils/types';

type TIngredientsResponse = {
  success: boolean;
  data: TIngredient[];
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

const request = <T>(url: string, options?: RequestInit): Promise<T> => {
  return fetch(url, options)
    .then((response) => checkResponse<T>(response))
    .catch((error: unknown) => Promise.reject(getError(error)));
};

export const getIngredients = (): Promise<TIngredient[]> => {
  return request<TIngredientsResponse>(INGREDIENTS_ENDPOINT).then((response) => {
    if (!response.success) {
      throw new Error('Не удалось загрузить ингредиенты');
    }

    return response.data;
  });
};

export const createOrder = (ingredientIds: string[]): Promise<number> => {
  return request<TCreateOrderResponse>(ORDERS_ENDPOINT, {
    body: JSON.stringify({ ingredients: ingredientIds }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  }).then((response) => {
    if (!response.success) {
      throw new Error('Не удалось оформить заказ');
    }

    return response.order.number;
  });
};
