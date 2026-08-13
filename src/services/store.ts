import { configureStore } from '@reduxjs/toolkit';

import { constructorReducer } from '@services/constructor/slice';
import { profileFeedMiddleware, publicFeedMiddleware } from '@services/feed/middleware';
import { ingredientsReducer } from '@services/ingredients/slice';
import { orderDetailsReducer } from '@services/order-details/slice';
import { orderReducer } from '@services/order/slice';
import { profileFeedReducer } from '@services/profile-feed/slice';
import { publicFeedReducer } from '@services/public-feed/slice';
import { userReducer } from '@services/user/slice';

export const store = configureStore({
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(publicFeedMiddleware, profileFeedMiddleware),
  reducer: {
    burgerConstructor: constructorReducer,
    ingredients: ingredientsReducer,
    order: orderReducer,
    orderDetails: orderDetailsReducer,
    profileFeed: profileFeedReducer,
    publicFeed: publicFeedReducer,
    user: userReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
