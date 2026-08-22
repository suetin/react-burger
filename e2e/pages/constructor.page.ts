import { expect, type Locator, type Page } from '@playwright/test';

import { expectedOrderTotal, testBun, testMain } from '../fixtures/test-data';

export type TIngredientFixture = 'bun' | 'main';

export class ConstructorPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly bunCard: Locator;
  readonly mainCard: Locator;
  readonly dropTarget: Locator;
  readonly orderButton: Locator;
  readonly dialog: Locator;
  readonly closeButton: Locator;
  readonly totalPrice: Locator;
  readonly constructorArea: Locator;
  readonly constructorBunTop: Locator;
  readonly constructorBunBottom: Locator;
  readonly constructorMain: Locator;
  readonly bunPlaceholders: Locator;
  readonly mainPlaceholder: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Соберите бургер' });
    this.bunCard = page.getByTestId(`ingredient-${testBun._id}`);
    this.mainCard = page.getByTestId(`ingredient-${testMain._id}`);
    this.dropTarget = page.getByTestId('constructor-drop-target');
    this.orderButton = page.getByRole('button', { name: 'Оформить заказ' });
    this.dialog = page.getByRole('dialog');
    this.closeButton = this.dialog.getByRole('button', { name: 'Закрыть' });
    this.totalPrice = page
      .locator('footer')
      .getByText(String(expectedOrderTotal), { exact: true });
    this.constructorArea = this.dropTarget.locator('..');
    this.constructorBunTop = this.constructorArea.getByText(`${testBun.name} (верх)`, {
      exact: true,
    });
    this.constructorBunBottom = this.constructorArea.getByText(`${testBun.name} (низ)`, {
      exact: true,
    });
    this.constructorMain = this.constructorArea.getByText(testMain.name, {
      exact: true,
    });
    this.bunPlaceholders = this.constructorArea.getByText('Выберите булки', {
      exact: true,
    });
    this.mainPlaceholder = this.constructorArea.getByText('Выберите начинку', {
      exact: true,
    });
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  async waitUntilReady(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.bunCard).toBeVisible();
    await expect(this.mainCard).toBeVisible();
    await expect(this.orderButton).toHaveText('Оформить заказ');
  }

  async dragIngredient(ingredient: TIngredientFixture): Promise<void> {
    const source = ingredient === 'bun' ? this.bunCard : this.mainCard;
    await source.dragTo(this.dropTarget);
  }

  async openIngredient(ingredient: TIngredientFixture): Promise<void> {
    const source = ingredient === 'bun' ? this.bunCard : this.mainCard;
    await source.click();
    await expect(this.dialog).toBeVisible();
  }

  async closeModal(): Promise<void> {
    await this.closeButton.click();
    await expect(this.dialog).toBeHidden();
  }

  async submitOrder(): Promise<void> {
    await this.orderButton.click();
    await expect(this.dialog).toBeVisible();
  }
}
