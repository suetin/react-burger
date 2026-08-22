import type { TConstructorIngredient, TIngredient } from '@utils/types';

const defaultIngredient: TIngredient = {
  _id: 'ingredient-id',
  name: 'Флюоресцентная булка R2-D3',
  type: 'bun',
  proteins: 10,
  fat: 20,
  carbohydrates: 30,
  calories: 40,
  price: 100,
  image: '/images/ingredient.png',
  image_large: '/images/ingredient-large.png',
  image_mobile: '/images/ingredient-mobile.png',
  __v: 0,
};

export const makeIngredient = (overrides: Partial<TIngredient> = {}): TIngredient => ({
  ...defaultIngredient,
  ...overrides,
});

export const makeConstructorIngredient = (
  constructorId: string,
  overrides: Partial<TIngredient> = {}
): TConstructorIngredient => ({
  ...makeIngredient(overrides),
  constructorId,
});
