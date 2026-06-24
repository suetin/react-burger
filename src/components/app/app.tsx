import { Preloader } from '@krgaa/react-developer-burger-ui-components';
import { useCallback, useEffect, useState } from 'react';

import { AppHeader } from '@components/app-header/app-header';
import { BurgerConstructor } from '@components/burger-constructor/burger-constructor';
import { BurgerIngredients } from '@components/burger-ingredients/burger-ingredients';
import { IngredientDetails } from '@components/ingredient-details/ingredient-details';
import { Modal } from '@components/modal/modal';
import { OrderDetails } from '@components/order-details/order-details';
import { getIngredients } from '@utils/api';
import { deriveConstructorSeed } from '@utils/burger-builder';

import type { TIngredient } from '@utils/types';

import styles from './app.module.css';

export const App = (): React.JSX.Element => {
  const [ingredients, setIngredients] = useState<TIngredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedIngredient, setSelectedIngredient] = useState<TIngredient | null>(null);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const constructorSeed = deriveConstructorSeed(ingredients);

  useEffect(() => {
    getIngredients()
      .then((data) => {
        setIngredients(data);
      })
      .catch(() => {
        setErrorMessage('Не удалось загрузить ингредиенты. Попробуйте позже.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleIngredientClick = useCallback((ingredient: TIngredient): void => {
    setSelectedIngredient(ingredient);
  }, []);

  const handleOrderClick = useCallback((): void => {
    setIsOrderDetailsOpen(true);
  }, []);

  const handleCloseModal = useCallback((): void => {
    setSelectedIngredient(null);
    setIsOrderDetailsOpen(false);
  }, []);

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
            ingredientCounts={constructorSeed.ingredientCounts}
            ingredients={ingredients}
            onIngredientClick={handleIngredientClick}
          />
          <BurgerConstructor
            burgerBun={constructorSeed.burgerBun}
            middleIngredients={constructorSeed.middleIngredients}
            onOrderClick={handleOrderClick}
          />
        </main>
      )}
      {selectedIngredient && (
        <Modal title="Детали ингредиента" onClose={handleCloseModal}>
          <IngredientDetails ingredient={selectedIngredient} />
        </Modal>
      )}
      {isOrderDetailsOpen && (
        <Modal onClose={handleCloseModal}>
          <OrderDetails />
        </Modal>
      )}
    </div>
  );
};

export default App;
