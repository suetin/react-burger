import { Preloader } from '@krgaa/react-developer-burger-ui-components';
import { useCallback, useEffect } from 'react';

import { AppHeader } from '@components/app-header/app-header';
import { BurgerConstructor } from '@components/burger-constructor/burger-constructor';
import { BurgerIngredients } from '@components/burger-ingredients/burger-ingredients';
import { IngredientDetails } from '@components/ingredient-details/ingredient-details';
import { Modal } from '@components/modal/modal';
import { OrderDetails } from '@components/order-details/order-details';
import { useAppDispatch, useAppSelector } from '@services/hooks';
import { selectConstructorIngredientCounts } from '@services/slices/constructor-slice';
import {
  clearIngredient,
  selectCurrentIngredient,
  selectIngredient,
} from '@services/slices/current-ingredient-slice';
import {
  fetchIngredients,
  selectIngredients,
  selectIngredientsError,
  selectIngredientsLoading,
} from '@services/slices/ingredients-slice';
import { clearOrder, selectOrderOpen } from '@services/slices/order-slice';

import type { TIngredient } from '@utils/types';

import styles from './app.module.css';

export const App = (): React.JSX.Element => {
  const dispatch = useAppDispatch();
  const ingredients = useAppSelector(selectIngredients);
  const ingredientCounts = useAppSelector(selectConstructorIngredientCounts);
  const isLoading = useAppSelector(selectIngredientsLoading);
  const errorMessage = useAppSelector(selectIngredientsError);
  const selectedIngredient = useAppSelector(selectCurrentIngredient);
  const isOrderDetailsOpen = useAppSelector(selectOrderOpen);

  useEffect(() => {
    void dispatch(fetchIngredients());
  }, [dispatch]);

  const handleIngredientClick = useCallback(
    (ingredient: TIngredient): void => {
      dispatch(selectIngredient(ingredient));
    },
    [dispatch]
  );

  const handleCloseIngredientModal = useCallback((): void => {
    dispatch(clearIngredient());
  }, [dispatch]);

  const handleCloseOrderModal = useCallback((): void => {
    dispatch(clearOrder());
  }, [dispatch]);

  return (
    <div className={styles.app}>
      <AppHeader />
      <h1 className={`${styles.title} text text_type_main-large mt-10 mb-5 pl-5`}>
        Соберите бургер
      </h1>
      {isLoading && <Preloader />}
      {!isLoading && errorMessage && (
        <p className={`${styles.message} text text_type_main-default`}>{errorMessage}</p>
      )}
      {!isLoading && !errorMessage && (
        <main className={`${styles.main} pl-5 pr-5`}>
          <BurgerIngredients
            ingredientCounts={ingredientCounts}
            ingredients={ingredients}
            onIngredientClick={handleIngredientClick}
          />
          <BurgerConstructor />
        </main>
      )}
      {selectedIngredient && (
        <Modal title="Детали ингредиента" onClose={handleCloseIngredientModal}>
          <IngredientDetails ingredient={selectedIngredient} />
        </Modal>
      )}
      {isOrderDetailsOpen && (
        <Modal onClose={handleCloseOrderModal}>
          <OrderDetails />
        </Modal>
      )}
    </div>
  );
};

export default App;
