import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { getIngredients } from '@utils/api';

import type { RootState } from '@services/store';
import type { TIngredient } from '@utils/types';

export const fetchIngredients = createAsyncThunk<
  TIngredient[],
  void,
  { state: { ingredients: { ingredients: TIngredient[]; isLoading: boolean } } }
>('ingredients/fetchIngredients', getIngredients, {
  condition: (_, { getState }) => {
    const { ingredients, isLoading } = getState().ingredients;
    return !isLoading && ingredients.length === 0;
  },
});

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
        if (state.currentRequestId !== action.meta.requestId) return;
        state.currentRequestId = null;
        state.ingredients = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchIngredients.rejected, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) return;
        state.currentRequestId = null;
        state.error = 'Не удалось загрузить ингредиенты. Попробуйте позже.';
        state.isLoading = false;
      });
  },
});

export const ingredientsReducer = ingredientsSlice.reducer;
export const selectIngredients = (state: RootState): TIngredient[] =>
  state.ingredients.ingredients;
export const selectIngredientsError = (state: RootState): string | null =>
  state.ingredients.error;
export const selectIngredientsLoading = (state: RootState): boolean =>
  state.ingredients.isLoading;
