import { createAsyncThunk } from '@reduxjs/toolkit';

import { sessionInvalidated } from '@services/user/session';
import { createOrder, isSessionInvalidatedError } from '@utils/api';

export const createOrderThunk = createAsyncThunk<number, string[]>(
  'order/createOrder',
  async (ingredientIds, { dispatch }) => {
    try {
      return await createOrder(ingredientIds);
    } catch (error) {
      if (isSessionInvalidatedError(error)) {
        dispatch(sessionInvalidated());
      }
      throw error;
    }
  }
);
