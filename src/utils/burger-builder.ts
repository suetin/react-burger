import type { TIngredient } from '@utils/types';

const MIDDLE_INGREDIENTS_LIMIT = 6;

export type TBurgerBuilderSeed = {
  burgerBun: TIngredient | undefined;
  middleIngredients: TIngredient[];
  ingredientCounts: Record<string, number>;
};

export const deriveConstructorSeed = (
  ingredients: TIngredient[]
): TBurgerBuilderSeed => {
  const burgerBun = ingredients.find((ingredient) => ingredient.type === 'bun');
  const middleIngredients = ingredients
    .filter((ingredient) => ingredient.type !== 'bun')
    .slice(0, MIDDLE_INGREDIENTS_LIMIT);
  const ingredientCounts: Record<string, number> = {};

  if (burgerBun) {
    ingredientCounts[burgerBun._id] = 2;
  }

  middleIngredients.forEach((ingredient) => {
    ingredientCounts[ingredient._id] = (ingredientCounts[ingredient._id] ?? 0) + 1;
  });

  return { burgerBun, middleIngredients, ingredientCounts };
};
