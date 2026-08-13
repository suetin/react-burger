import type { TIngredient } from '@utils/types';

export type TOrderStatus = 'created' | 'pending' | 'done';

export type TOrder = {
  _id: string;
  createdAt: string;
  ingredients: string[];
  name: string;
  number: number;
  status: TOrderStatus;
  updatedAt: string;
};

export type TOrdersMessage = {
  orders: TOrder[];
  success: true;
  total: number;
  totalToday: number;
};

export type TOrderResponse = {
  order: TOrder;
  success: true;
};

export type TOrderStatusGroup = 'ready' | 'work';

export type TGroupedOrderIngredient = {
  ingredient: TIngredient;
  quantity: number;
  unitPrice: number;
};

export type TOrderViewModel = {
  groupedIngredients: TGroupedOrderIngredient[];
  order: TOrder;
  resolvedIngredients: TIngredient[];
  statusGroup: TOrderStatusGroup;
  statusText: string;
  totalPrice: number;
};

export type TIngredientCatalogState = 'loading' | 'ready' | 'error';

export type TOrderPresentationResult =
  | { order: TOrder; state: 'error' | 'loading' | 'unresolvable' }
  | { state: 'ready'; value: TOrderViewModel };
