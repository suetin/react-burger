import { describe, expect, it } from 'vitest';

import {
  addIngredient,
  clearConstructor,
  constructorReducer,
  moveIngredient,
  removeIngredientByConstructorId,
  selectConstructorIngredientCounts,
  selectConstructorIngredientIds,
  selectConstructorTotalPrice,
} from '@services/constructor/slice';

import { makeConstructorIngredient, makeIngredient } from '../../test/fixtures';

import type { TConstructorState } from '@services/constructor/slice';
import type { RootState } from '@services/store';

const initialState: TConstructorState = {
  bun: null,
  ingredients: [],
};

const stateWithIngredients = (): TConstructorState => ({
  bun: makeIngredient({ _id: 'bun-id', name: 'Булка', type: 'bun', price: 100 }),
  ingredients: [
    makeConstructorIngredient('first', {
      _id: 'first-id',
      name: 'Первая начинка',
      type: 'main',
      price: 10,
    }),
    makeConstructorIngredient('second', {
      _id: 'second-id',
      name: 'Вторая начинка',
      type: 'sauce',
      price: 20,
    }),
    makeConstructorIngredient('third', {
      _id: 'third-id',
      name: 'Третья начинка',
      type: 'main',
      price: 30,
    }),
  ],
});

const asRootState = (burgerConstructor: TConstructorState): RootState =>
  ({ burgerConstructor }) as RootState;

describe('constructorReducer', () => {
  it('returns the exact initial state for undefined and unknown actions', () => {
    expect(constructorReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('adds a bun', () => {
    const bun = makeIngredient({ _id: 'bun-id', type: 'bun' });

    expect(constructorReducer(initialState, addIngredient(bun))).toEqual({
      bun,
      ingredients: [],
    });
  });

  it('replaces a previously selected bun', () => {
    const firstBun = makeIngredient({ _id: 'first-bun', type: 'bun' });
    const secondBun = makeIngredient({ _id: 'second-bun', type: 'bun' });
    const state = constructorReducer(initialState, addIngredient(firstBun));

    expect(constructorReducer(state, addIngredient(secondBun))).toEqual({
      bun: secondBun,
      ingredients: [],
    });
  });

  it.each([
    ['main', makeIngredient({ _id: 'main-id', type: 'main' })],
    ['sauce', makeIngredient({ _id: 'sauce-id', type: 'sauce' })],
  ] as const)('adds a %s with a non-empty unique constructor ID', (_, ingredient) => {
    const first = constructorReducer(initialState, addIngredient(ingredient));
    const second = constructorReducer(first, addIngredient(ingredient));
    const [firstAdded, secondAdded] = second.ingredients;

    expect(firstAdded).toEqual(expect.objectContaining(ingredient));
    expect(secondAdded).toEqual(expect.objectContaining(ingredient));
    expect(firstAdded?.constructorId).toEqual(expect.any(String));
    expect(secondAdded?.constructorId).toEqual(expect.any(String));
    expect(firstAdded?.constructorId).not.toHaveLength(0);
    expect(secondAdded?.constructorId).not.toHaveLength(0);
    expect(firstAdded?.constructorId).not.toBe(secondAdded?.constructorId);
  });

  it('adds a filling without changing the selected bun', () => {
    const bun = makeIngredient({ _id: 'bun-id', type: 'bun' });
    const filling = makeIngredient({ _id: 'filling-id', type: 'main' });
    const withBun = constructorReducer(initialState, addIngredient(bun));

    expect(constructorReducer(withBun, addIngredient(filling))).toEqual({
      bun,
      ingredients: [expect.objectContaining(filling)],
    });
  });

  it('clears the constructor to the exact initial state', () => {
    expect(constructorReducer(stateWithIngredients(), clearConstructor())).toEqual(
      initialState
    );
  });

  it('moves an ingredient forward and backward', () => {
    const state = stateWithIngredients();
    const movedForward = constructorReducer(
      state,
      moveIngredient({ constructorId: 'third', toIndex: 0 })
    );
    const movedBackward = constructorReducer(
      movedForward,
      moveIngredient({ constructorId: 'third', toIndex: 2 })
    );

    expect(movedForward.ingredients.map(({ constructorId }) => constructorId)).toEqual([
      'third',
      'first',
      'second',
    ]);
    expect(movedBackward).toEqual(state);
  });

  it.each([
    ['same index', { constructorId: 'second', toIndex: 1 }],
    ['unknown ID', { constructorId: 'unknown', toIndex: 0 }],
    ['negative index', { constructorId: 'second', toIndex: -1 }],
    ['out-of-range index', { constructorId: 'second', toIndex: 3 }],
  ] as const)('does nothing for %s', (_, action) => {
    const state = stateWithIngredients();

    expect(constructorReducer(state, moveIngredient(action))).toEqual(state);
  });

  it('removes only the ingredient with the target constructor ID', () => {
    const state = stateWithIngredients();

    expect(constructorReducer(state, removeIngredientByConstructorId('second'))).toEqual(
      {
        ...state,
        ingredients: [state.ingredients[0], state.ingredients[2]],
      }
    );
  });

  it('does nothing when removing an unknown constructor ID', () => {
    const state = stateWithIngredients();

    expect(
      constructorReducer(state, removeIngredientByConstructorId('unknown'))
    ).toEqual(state);
  });
});

describe('constructor selectors', () => {
  it('counts the bun twice and calculates its price twice', () => {
    const state: TConstructorState = {
      bun: makeIngredient({ _id: 'bun-id', type: 'bun', price: 100 }),
      ingredients: [
        makeConstructorIngredient('filling', {
          _id: 'filling-id',
          type: 'main',
          price: 25,
        }),
      ],
    };

    expect(selectConstructorIngredientCounts(asRootState(state))).toEqual({
      'bun-id': 2,
      'filling-id': 1,
    });
    expect(selectConstructorTotalPrice(asRootState(state))).toBe(225);
  });

  it('returns order ingredient IDs in bun, fillings, bun order', () => {
    const state: TConstructorState = {
      bun: makeIngredient({ _id: 'bun-id', type: 'bun' }),
      ingredients: [
        makeConstructorIngredient('first', { _id: 'first-id', type: 'main' }),
        makeConstructorIngredient('second', { _id: 'second-id', type: 'sauce' }),
      ],
    };

    expect(selectConstructorIngredientIds(asRootState(state))).toEqual([
      'bun-id',
      'first-id',
      'second-id',
      'bun-id',
    ]);
  });
});
