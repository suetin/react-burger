import { createSelector, createSlice, nanoid } from '@reduxjs/toolkit';

import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@services/store';
import type { TConstructorIngredient, TIngredient } from '@utils/types';

export type TConstructorState = {
  bun: TIngredient | null;
  ingredients: TConstructorIngredient[];
};

type TMoveIngredientPayload = {
  constructorId: string;
  toIndex: number;
};

const initialState: TConstructorState = {
  bun: null,
  ingredients: [],
};

const constructorSlice = createSlice({
  name: 'burgerConstructor',
  initialState,
  reducers: {
    addIngredient: {
      prepare: (ingredient: TIngredient) => ({
        payload: {
          constructorId: nanoid(),
          ingredient,
        },
      }),
      reducer: (
        state,
        action: PayloadAction<{ constructorId: string; ingredient: TIngredient }>
      ) => {
        const { constructorId, ingredient } = action.payload;

        if (ingredient.type === 'bun') {
          state.bun = ingredient;
          return;
        }

        state.ingredients.push({ ...ingredient, constructorId });
      },
    },
    clearConstructor: () => initialState,
    moveIngredient: (state, action: PayloadAction<TMoveIngredientPayload>) => {
      const { constructorId, toIndex } = action.payload;
      const fromIndex = state.ingredients.findIndex(
        (ingredient) => ingredient.constructorId === constructorId
      );

      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        toIndex >= state.ingredients.length
      ) {
        return;
      }

      const [ingredient] = state.ingredients.splice(fromIndex, 1);

      if (ingredient) {
        state.ingredients.splice(toIndex, 0, ingredient);
      }
    },
    removeIngredientByConstructorId: (state, action: PayloadAction<string>) => {
      state.ingredients = state.ingredients.filter(
        (ingredient) => ingredient.constructorId !== action.payload
      );
    },
  },
});

export const {
  addIngredient,
  clearConstructor,
  moveIngredient,
  removeIngredientByConstructorId,
} = constructorSlice.actions;
export const constructorReducer = constructorSlice.reducer;

export const selectConstructorBun = (state: RootState): TIngredient | null => {
  return state.burgerConstructor.bun;
};

export const selectConstructorIngredients = (
  state: RootState
): TConstructorIngredient[] => {
  return state.burgerConstructor.ingredients;
};

export const selectConstructorIngredientCounts = createSelector(
  [selectConstructorBun, selectConstructorIngredients],
  (bun, ingredients): Record<string, number> => {
    const counts: Record<string, number> = {};

    if (bun) {
      counts[bun._id] = 2;
    }

    ingredients.forEach((ingredient) => {
      counts[ingredient._id] = (counts[ingredient._id] ?? 0) + 1;
    });

    return counts;
  }
);

export const selectConstructorIngredientIds = createSelector(
  [selectConstructorBun, selectConstructorIngredients],
  (bun, ingredients): string[] => {
    if (!bun) {
      return [];
    }

    return [bun._id, ...ingredients.map((ingredient) => ingredient._id), bun._id];
  }
);

export const selectConstructorTotalPrice = createSelector(
  [selectConstructorBun, selectConstructorIngredients],
  (bun, ingredients): number => {
    const bunPrice = bun ? bun.price * 2 : 0;
    const ingredientsPrice = ingredients.reduce(
      (sum, ingredient) => sum + ingredient.price,
      0
    );

    return bunPrice + ingredientsPrice;
  }
);
