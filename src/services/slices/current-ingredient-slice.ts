import { createSlice } from '@reduxjs/toolkit';

import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@services/store';
import type { TIngredient } from '@utils/types';

export type TCurrentIngredientState = {
  ingredient: TIngredient | null;
};

const initialState: TCurrentIngredientState = {
  ingredient: null,
};

const currentIngredientSlice = createSlice({
  name: 'currentIngredient',
  initialState,
  reducers: {
    clearIngredient: (state) => {
      state.ingredient = null;
    },
    selectIngredient: (state, action: PayloadAction<TIngredient>) => {
      state.ingredient = action.payload;
    },
  },
});

export const { clearIngredient, selectIngredient } = currentIngredientSlice.actions;
export const currentIngredientReducer = currentIngredientSlice.reducer;

export const selectCurrentIngredient = (state: RootState): TIngredient | null => {
  return state.currentIngredient.ingredient;
};
