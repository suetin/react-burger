import { describe, expect, it } from 'vitest';

import { parseOrderResponse, parseOrdersMessage } from '@utils/order-validation';

const order = {
  _id: 'order-id',
  createdAt: '2026-08-13T07:00:00.000Z',
  ingredients: ['ingredient-id'],
  name: 'Флюоресцентный бургер',
  number: 12345,
  status: 'done',
  updatedAt: '2026-08-13T07:01:00.000Z',
} as const;

describe('parseOrderResponse', () => {
  it('принимает REST-ответ с единственным заказом', () => {
    expect(parseOrderResponse({ order, success: true })).toEqual({
      data: { order, success: true },
      success: true,
    });
  });

  it('отклоняет форму ответа со списком заказов', () => {
    expect(parseOrderResponse({ orders: [order], success: true })).toEqual({
      error: 'Invalid order response',
      success: false,
    });
  });
});

describe('parseOrdersMessage', () => {
  it('принимает WebSocket-заказ без name и добавляет безопасное название', () => {
    const { name: _name, ...orderWithoutName } = order;

    expect(
      parseOrdersMessage({
        orders: [orderWithoutName],
        success: true,
        total: 1,
        totalToday: 1,
      })
    ).toEqual({
      data: {
        orders: [{ ...orderWithoutName, name: 'Заказ #12345' }],
        success: true,
        total: 1,
        totalToday: 1,
      },
      success: true,
    });
  });
});
