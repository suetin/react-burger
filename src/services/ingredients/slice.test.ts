import { describe, expect, it } from 'vitest';

import { fetchIngredients } from '@services/ingredients/actions';
import { ingredientsReducer, type TIngredientsState } from '@services/ingredients/slice';

import { makeIngredient } from '../../test/fixtures';

const initialState: TIngredientsState = {
  currentRequestId: null,
  error: null,
  ingredients: [],
  isLoading: false,
};

describe('ingredientsReducer', () => {
  it('returns the exact initial state for undefined and unknown actions', () => {
    expect(ingredientsReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('handles pending by tracking the request, clearing errors, and loading', () => {
    const state: TIngredientsState = {
      currentRequestId: 'old-request',
      error: 'Старая ошибка',
      ingredients: [makeIngredient({ _id: 'old-ingredient' })],
      isLoading: false,
    };

    expect(
      ingredientsReducer(state, fetchIngredients.pending('request-id', undefined))
    ).toEqual({
      currentRequestId: 'request-id',
      error: null,
      ingredients: state.ingredients,
      isLoading: true,
    });
  });

  it('handles a matching fulfilled request', () => {
    const ingredients = [
      makeIngredient({ _id: 'bun-id', type: 'bun' }),
      makeIngredient({ _id: 'main-id', type: 'main' }),
    ];
    const pendingState = ingredientsReducer(
      { ...initialState, error: 'Старая ошибка' },
      fetchIngredients.pending('request-id', undefined)
    );

    expect(
      ingredientsReducer(
        pendingState,
        fetchIngredients.fulfilled(ingredients, 'request-id', undefined)
      )
    ).toEqual({
      currentRequestId: null,
      error: null,
      ingredients,
      isLoading: false,
    });
  });

  it('ignores a stale fulfilled request', () => {
    const state = ingredientsReducer(
      { ...initialState, ingredients: [makeIngredient({ _id: 'current' })] },
      fetchIngredients.pending('current-request', undefined)
    );
    const staleIngredients = [makeIngredient({ _id: 'stale' })];

    expect(
      ingredientsReducer(
        state,
        fetchIngredients.fulfilled(staleIngredients, 'stale-request', undefined)
      )
    ).toEqual(state);
  });

  it('handles a matching rejected request with the exact error', () => {
    const pendingState = ingredientsReducer(
      initialState,
      fetchIngredients.pending('request-id', undefined)
    );

    expect(
      ingredientsReducer(
        pendingState,
        fetchIngredients.rejected(new Error('network error'), 'request-id', undefined)
      )
    ).toEqual({
      currentRequestId: null,
      error: 'Не удалось загрузить ингредиенты. Попробуйте позже.',
      ingredients: [],
      isLoading: false,
    });
  });

  it('ignores a stale rejected request', () => {
    const state = ingredientsReducer(
      initialState,
      fetchIngredients.pending('current-request', undefined)
    );

    expect(
      ingredientsReducer(
        state,
        fetchIngredients.rejected(new Error('stale error'), 'stale-request', undefined)
      )
    ).toEqual(state);
  });
});
