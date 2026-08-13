import type {
  TOrder,
  TOrderResponse,
  TOrdersMessage,
  TOrderStatus,
} from '@utils/order-types';

export type TParseResult<T> =
  | { data: T; success: true }
  | { error: string; success: false };

const INVALID_TOKEN_MESSAGE = 'Invalid or missing token';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonBlankString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isNonNegativeInteger = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isFinite(value) &&
  Number.isInteger(value) &&
  value >= 0;

const isTimestamp = (value: unknown): value is string =>
  typeof value === 'string' && Number.isFinite(Date.parse(value));

type TOrderPayload = Omit<TOrder, 'name'> & { name?: unknown };

const hasValidOptionalName = (value: Record<string, unknown>): boolean =>
  !('name' in value) || isNonBlankString(value.name);

export const isOrderStatus = (value: unknown): value is TOrderStatus =>
  value === 'created' || value === 'pending' || value === 'done';

const isOrderPayload = (value: unknown): value is TOrderPayload =>
  isRecord(value) &&
  isNonBlankString(value._id) &&
  hasValidOptionalName(value) &&
  isNonNegativeInteger(value.number) &&
  isOrderStatus(value.status) &&
  Array.isArray(value.ingredients) &&
  value.ingredients.length > 0 &&
  value.ingredients.every(isNonBlankString) &&
  isTimestamp(value.createdAt) &&
  isTimestamp(value.updatedAt);

export const isOrder = (value: unknown): value is TOrder =>
  isOrderPayload(value) && isNonBlankString(value.name);

const parseOrder = (value: unknown): TOrder | undefined => {
  if (!isOrderPayload(value)) return undefined;

  return {
    ...value,
    name: isNonBlankString(value.name) ? value.name : `Заказ #${value.number}`,
  };
};

const parseJson = (
  value: unknown
): { success: false } | { success: true; value: unknown } => {
  if (typeof value !== 'string') {
    return { success: true, value };
  }

  try {
    return { success: true, value: JSON.parse(value) as unknown };
  } catch {
    return { success: false };
  }
};

export const isInvalidTokenMessage = (value: unknown): boolean => {
  const parseResult = parseJson(value);
  return (
    parseResult.success &&
    isRecord(parseResult.value) &&
    parseResult.value.message === INVALID_TOKEN_MESSAGE
  );
};

export const parseOrdersMessage = (value: unknown): TParseResult<TOrdersMessage> => {
  const parseResult = parseJson(value);

  if (
    !parseResult.success ||
    !isRecord(parseResult.value) ||
    parseResult.value.success !== true ||
    !Array.isArray(parseResult.value.orders) ||
    !isNonNegativeInteger(parseResult.value.total) ||
    !isNonNegativeInteger(parseResult.value.totalToday)
  ) {
    return { error: 'Invalid orders message', success: false };
  }

  return {
    data: {
      orders: parseResult.value.orders
        .map(parseOrder)
        .filter((order): order is TOrder => order !== undefined),
      success: true,
      total: parseResult.value.total,
      totalToday: parseResult.value.totalToday,
    },
    success: true,
  };
};

export const parseOrderResponse = (value: unknown): TParseResult<TOrderResponse> => {
  const parseResult = parseJson(value);

  if (
    !parseResult.success ||
    !isRecord(parseResult.value) ||
    parseResult.value.success !== true
  ) {
    return { error: 'Invalid order response', success: false };
  }

  const order = parseOrder(parseResult.value.order);
  if (!order) return { error: 'Invalid order response', success: false };

  return {
    data: {
      order,
      success: true,
    },
    success: true,
  };
};
