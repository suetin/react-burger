import { afterEach, describe, expect, it, vi } from 'vitest';

import { getOrderById } from '@utils/api';

const order = {
  _id: 'order-id',
  createdAt: '2026-08-13T07:00:00.000Z',
  ingredients: ['ingredient-id'],
  name: 'Флюоресцентный бургер',
  number: 12345,
  status: 'done',
  updatedAt: '2026-08-13T07:01:00.000Z',
} as const;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getOrderById', () => {
  it('возвращает заказ из singular REST-ответа', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ order, success: true }), {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        })
      )
    );

    await expect(getOrderById(order._id)).resolves.toEqual(order);
  });

  it('отклоняет заказ с другим идентификатором', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ order: { ...order, _id: 'another-id' }, success: true }),
          {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      )
    );

    await expect(getOrderById(order._id)).rejects.toEqual(
      expect.objectContaining({ message: 'Invalid order response' })
    );
  });
});
