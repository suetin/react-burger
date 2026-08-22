import type { TIngredient, TUser } from '../../src/utils/types';

const TEST_IMAGE =
  'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221%22%20height%3D%221%22%20viewBox%3D%220%200%201%201%22%3E%3Crect%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%2300ff00%22%2F%3E%3C%2Fsvg%3E';

export const testBun: TIngredient = {
  _id: 'e2e-sprint6-bun',
  name: 'Тестовая булка Sprint 6',
  type: 'bun',
  proteins: 10,
  fat: 5,
  carbohydrates: 20,
  calories: 200,
  price: 100,
  image: TEST_IMAGE,
  image_large: TEST_IMAGE,
  image_mobile: TEST_IMAGE,
  __v: 0,
};

export const testMain: TIngredient = {
  _id: 'e2e-sprint6-main',
  name: 'Тестовая начинка Sprint 6',
  type: 'main',
  proteins: 15,
  fat: 8,
  carbohydrates: 12,
  calories: 150,
  price: 75,
  image: TEST_IMAGE,
  image_large: TEST_IMAGE,
  image_mobile: TEST_IMAGE,
  __v: 0,
};

export const testIngredients: TIngredient[] = [testBun, testMain];

export const testUser: TUser = {
  email: 'sprint6.e2e@example.test',
  name: 'Sprint 6 E2E User',
};

export const testTokens = {
  accessToken: 'Bearer e2e-access-token',
  refreshToken: 'e2e-refresh-token',
} as const;

export const expectedOrderNumber = 424242;
export const expectedOrderTotal = testBun.price * 2 + testMain.price;

export const expectedOrderIngredients = [
  testBun._id,
  testMain._id,
  testBun._id,
] as const;
