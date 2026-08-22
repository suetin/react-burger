import { expect, test, type Request } from '@playwright/test';

import {
  expectedOrderIngredients,
  expectedOrderNumber,
  expectedOrderTotal,
  testBun,
  testTokens,
} from './fixtures/test-data';
import { ConstructorPage } from './pages/constructor.page';

const HAR_PATH = 'e2e/fixtures/constructor.har';

test.describe('Конструктор бургера', () => {
  let constructorPage: ConstructorPage;

  test.beforeEach(async ({ context, page }) => {
    await context.routeFromHAR(HAR_PATH, {
      notFound: 'abort',
      update: false,
      url: '**/api/**',
    });
    await context.addInitScript(({ accessToken, refreshToken }) => {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    }, testTokens);

    constructorPage = new ConstructorPage(page);
    await constructorPage.goto();
    await constructorPage.waitUntilReady();
  });

  test('открывает данные ингредиента и закрывает модальное окно', async ({ page }) => {
    await constructorPage.openIngredient('bun');

    await expect(page).toHaveURL(`/ingredients/${testBun._id}`);
    await expect(constructorPage.dialog).toBeVisible();
    await expect(
      constructorPage.dialog.getByRole('heading', {
        name: 'Детали ингредиента',
        exact: true,
      })
    ).toBeVisible();
    await expect(
      constructorPage.dialog.getByRole('heading', { name: testBun.name, exact: true })
    ).toBeVisible();
    await expect(
      constructorPage.dialog.getByRole('img', { name: testBun.name, exact: true })
    ).toHaveAttribute('src', testBun.image_large);

    for (const [label, value] of [
      ['Калории, ккал', testBun.calories],
      ['Белки, г', testBun.proteins],
      ['Жиры, г', testBun.fat],
      ['Углеводы, г', testBun.carbohydrates],
    ] as const) {
      await expect(
        constructorPage.dialog.getByText(label, { exact: true })
      ).toBeVisible();
      await expect(
        constructorPage.dialog.getByText(String(value), { exact: true })
      ).toBeVisible();
    }

    await constructorPage.closeModal();
    await expect(page).toHaveURL('/');
  });

  test('добавляет ингредиенты, оформляет заказ и очищает конструктор', async ({
    page,
  }) => {
    await constructorPage.dragIngredient('bun');
    await constructorPage.dragIngredient('main');

    await expect(constructorPage.constructorBunTop).toBeVisible();
    await expect(constructorPage.constructorBunBottom).toBeVisible();
    await expect(constructorPage.constructorMain).toBeVisible();
    await expect(constructorPage.totalPrice).toHaveText(String(expectedOrderTotal));
    await expect(constructorPage.orderButton).toBeEnabled();

    const orderRequests: Request[] = [];
    const onRequest = (request: Request): void => {
      if (request.method() === 'POST' && request.url().endsWith('/api/orders')) {
        orderRequests.push(request);
      }
    };
    page.on('request', onRequest);

    try {
      await constructorPage.submitOrder();
      await expect.poll(() => orderRequests.length).toBe(1);
    } finally {
      page.off('request', onRequest);
    }

    const orderRequest = orderRequests[0];
    expect(orderRequest).toBeDefined();
    expect(JSON.parse(orderRequest?.postData() ?? '')).toEqual({
      ingredients: expectedOrderIngredients,
    });
    await expect(page).not.toHaveURL(/\/(?:login|register)(?:[/?#]|$)/);
    await expect(
      constructorPage.dialog.getByText(String(expectedOrderNumber), { exact: true })
    ).toBeVisible();
    await expect(
      constructorPage.dialog.getByText('идентификатор заказа', { exact: true })
    ).toBeVisible();

    await constructorPage.closeModal();
    await expect(constructorPage.bunPlaceholders).toHaveCount(2);
    await expect(constructorPage.mainPlaceholder).toBeVisible();
  });
});
