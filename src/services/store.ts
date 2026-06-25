import { configureStore } from '@reduxjs/toolkit';

import { constructorReducer } from '@services/slices/constructor-slice';
import { currentIngredientReducer } from '@services/slices/current-ingredient-slice';
import { ingredientsReducer } from '@services/slices/ingredients-slice';
import { orderReducer } from '@services/slices/order-slice';

export const store = configureStore({
  reducer: {
    burgerConstructor: constructorReducer,
    currentIngredient: currentIngredientReducer,
    ingredients: ingredientsReducer,
    order: orderReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
