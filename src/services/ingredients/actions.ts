import { createAsyncThunk } from '@reduxjs/toolkit';

import { getIngredients } from '@utils/api';

import type { RootState } from '@services/store';
import type { TIngredient } from '@utils/types';

export const fetchIngredients = createAsyncThunk<
  TIngredient[],
  void,
  { state: RootState }
>('ingredients/fetchIngredients', getIngredients, {
  condition: (_, { getState }) => {
    const { ingredients, isLoading } = getState().ingredients;
    return !isLoading && ingredients.length === 0;
  },
});
