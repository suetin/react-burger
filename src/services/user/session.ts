import { createAction } from '@reduxjs/toolkit';

import { clearTokens } from '@utils/token-storage';

export const sessionInvalidated = createAction('user/sessionInvalidated', () => {
  clearTokens();
  return { payload: undefined };
});
