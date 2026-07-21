import { Preloader } from '@krgaa/react-developer-burger-ui-components';
import { useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import { BurgerConstructor } from '@components/burger-constructor/burger-constructor';
import { BurgerIngredients } from '@components/burger-ingredients/burger-ingredients';
import { Modal } from '@components/modal/modal';
import { OrderDetails } from '@components/order-details/order-details';
import {
  clearConstructor,
  selectConstructorIngredientCounts,
} from '@services/constructor/slice';
import { useAppDispatch, useAppSelector } from '@services/hooks';
import {
  selectIngredients,
  selectIngredientsError,
  selectIngredientsLoading,
} from '@services/ingredients/slice';
import { clearOrder, selectOrderNumber, selectOrderOpen } from '@services/order/slice';

import styles from './home-page.module.css';

export const Home = (): React.JSX.Element => {
  const dispatch = useAppDispatch();
  const ingredients = useAppSelector(selectIngredients);
  const ingredientCounts = useAppSelector(selectConstructorIngredientCounts);
  const isLoading = useAppSelector(selectIngredientsLoading);
  const errorMessage = useAppSelector(selectIngredientsError);
  const isOrderDetailsOpen = useAppSelector(selectOrderOpen);
  const orderNumber = useAppSelector(selectOrderNumber);

  const handleCloseOrderModal = useCallback((): void => {
    if (orderNumber) dispatch(clearConstructor());
    dispatch(clearOrder());
  }, [dispatch, orderNumber]);

  return (
    <DndProvider backend={HTML5Backend}>
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
          />
          <BurgerConstructor />
        </main>
      )}
      {isOrderDetailsOpen && (
        <Modal onClose={handleCloseOrderModal}>
          <OrderDetails />
        </Modal>
      )}
    </DndProvider>
  );
};
