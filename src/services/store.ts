import { configureStore } from '@reduxjs/toolkit';

import { constructorReducer } from '@services/constructor/slice';
import { ingredientsReducer } from '@services/ingredients/slice';
import { orderReducer } from '@services/order/slice';
import { userReducer } from '@services/user/slice';

export const store = configureStore({
  reducer: {
    burgerConstructor: constructorReducer,
    ingredients: ingredientsReducer,
    order: orderReducer,
    user: userReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
