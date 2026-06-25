import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { getIngredients } from '@utils/api';

import type { RootState } from '@services/store';
import type { TIngredient } from '@utils/types';

export type TIngredientsState = {
  currentRequestId: string | null;
  error: string | null;
  ingredients: TIngredient[];
  isLoading: boolean;
};

const initialState: TIngredientsState = {
  currentRequestId: null,
  error: null,
  ingredients: [],
  isLoading: false,
};

export const fetchIngredients = createAsyncThunk<TIngredient[]>(
  'ingredients/fetchIngredients',
  getIngredients
);

const ingredientsSlice = createSlice({
  name: 'ingredients',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchIngredients.pending, (state, action) => {
        state.currentRequestId = action.meta.requestId;
        state.error = null;
        state.isLoading = true;
      })
      .addCase(fetchIngredients.fulfilled, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) {
          return;
        }

        state.currentRequestId = null;
        state.error = null;
        state.ingredients = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchIngredients.rejected, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) {
          return;
        }

        state.currentRequestId = null;
        state.error = 'Не удалось загрузить ингредиенты. Попробуйте позже.';
        state.isLoading = false;
      });
  },
});

export const ingredientsReducer = ingredientsSlice.reducer;

export const selectIngredients = (state: RootState): TIngredient[] => {
  return state.ingredients.ingredients;
};

export const selectIngredientsError = (state: RootState): string | null => {
  return state.ingredients.error;
};

export const selectIngredientsLoading = (state: RootState): boolean => {
  return state.ingredients.isLoading;
};
