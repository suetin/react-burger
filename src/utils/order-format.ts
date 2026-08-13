import type {
  TGroupedOrderIngredient,
  TIngredientCatalogState,
  TOrder,
  TOrderPresentationResult,
  TOrderStatus,
  TOrderStatusGroup,
} from '@utils/order-types';
import type { TIngredient } from '@utils/types';

const MAX_STATUS_ORDERS = 20;
const STATUS_COLUMN_SIZE = 10;
const VISIBLE_INGREDIENT_COUNT = 6;

const STATUS_LABELS: Record<TOrderStatus, string> = {
  created: 'Создан',
  done: 'Выполнен',
  pending: 'Готовится',
};

type TTimestampFormatOptions = {
  locale?: Intl.LocalesArgument;
  timeZone?: string;
};

export const getOrderStatusLabel = (status: TOrderStatus): string =>
  STATUS_LABELS[status];

export const getOrderStatusGroup = (status: TOrderStatus): TOrderStatusGroup =>
  status === 'done' ? 'ready' : 'work';

const createIngredientMap = (
  ingredients: readonly TIngredient[]
): ReadonlyMap<string, TIngredient> =>
  new Map(ingredients.map((ingredient) => [ingredient._id, ingredient]));

export const resolveOrderIngredients = (
  order: TOrder,
  ingredients: readonly TIngredient[]
): TIngredient[] | undefined => {
  const ingredientMap = createIngredientMap(ingredients);
  const resolvedIngredients = order.ingredients.map((ingredientId) =>
    ingredientMap.get(ingredientId)
  );

  if (resolvedIngredients.some((ingredient) => ingredient === undefined)) {
    return undefined;
  }

  return resolvedIngredients.filter(
    (ingredient): ingredient is TIngredient => ingredient !== undefined
  );
};

const groupResolvedIngredients = (
  ingredients: readonly TIngredient[]
): TGroupedOrderIngredient[] => {
  const groupedIngredients = new Map<string, TGroupedOrderIngredient>();

  ingredients.forEach((ingredient) => {
    const existingIngredient = groupedIngredients.get(ingredient._id);

    if (existingIngredient) {
      groupedIngredients.set(ingredient._id, {
        ...existingIngredient,
        quantity: existingIngredient.quantity + 1,
      });
      return;
    }

    groupedIngredients.set(ingredient._id, {
      ingredient,
      quantity: 1,
      unitPrice: ingredient.price,
    });
  });

  return [...groupedIngredients.values()];
};

export const calculateOrderTotal = (
  order: TOrder,
  ingredients: readonly TIngredient[]
): number | undefined => {
  const resolvedIngredients = resolveOrderIngredients(order, ingredients);

  if (!resolvedIngredients) {
    return undefined;
  }

  return resolvedIngredients.reduce((total, ingredient) => total + ingredient.price, 0);
};

export const groupOrderIngredients = (
  order: TOrder,
  ingredients: readonly TIngredient[]
): TGroupedOrderIngredient[] | undefined => {
  const resolvedIngredients = resolveOrderIngredients(order, ingredients);

  return resolvedIngredients ? groupResolvedIngredients(resolvedIngredients) : undefined;
};

export const deriveOrderViewModel = (
  order: TOrder,
  ingredients: readonly TIngredient[],
  catalogState: TIngredientCatalogState
): TOrderPresentationResult => {
  if (catalogState !== 'ready') {
    return { order, state: catalogState };
  }

  const resolvedIngredients = resolveOrderIngredients(order, ingredients);

  if (!resolvedIngredients) {
    return { order, state: 'unresolvable' };
  }

  return {
    state: 'ready',
    value: {
      groupedIngredients: groupResolvedIngredients(resolvedIngredients),
      order,
      resolvedIngredients,
      statusGroup: getOrderStatusGroup(order.status),
      statusText: getOrderStatusLabel(order.status),
      totalPrice: resolvedIngredients.reduce(
        (total, ingredient) => total + ingredient.price,
        0
      ),
    },
  };
};

export const getOrderNumberColumns = (
  orders: readonly TOrder[],
  statusGroup: TOrderStatusGroup
): number[][] => {
  const orderNumbers = orders
    .filter((order) => getOrderStatusGroup(order.status) === statusGroup)
    .slice(0, MAX_STATUS_ORDERS)
    .map((order) => order.number);

  if (orderNumbers.length === 0) {
    return [];
  }

  return [
    orderNumbers.slice(0, STATUS_COLUMN_SIZE),
    orderNumbers.slice(STATUS_COLUMN_SIZE),
  ].filter((column) => column.length > 0);
};

export const getIngredientStack = (
  ingredients: readonly TIngredient[]
): { overflowCount: number; visibleIngredients: TIngredient[] } => ({
  overflowCount: Math.max(ingredients.length - VISIBLE_INGREDIENT_COUNT, 0),
  visibleIngredients: ingredients.slice(0, VISIBLE_INGREDIENT_COUNT),
});

export const formatOrderTimestamp = (
  timestamp: string,
  { locale = 'ru-RU', timeZone }: TTimestampFormatOptions = {}
): string => {
  const milliseconds = Date.parse(timestamp);

  if (!Number.isFinite(milliseconds)) {
    return '';
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone,
  }).format(new Date(milliseconds));
};
