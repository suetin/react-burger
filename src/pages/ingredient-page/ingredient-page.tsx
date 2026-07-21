import { Preloader } from '@krgaa/react-developer-burger-ui-components';
import { useParams } from 'react-router-dom';

import { IngredientDetails } from '@components/ingredient-details/ingredient-details';
import { useAppSelector } from '@services/hooks';
import {
  selectIngredients,
  selectIngredientsError,
  selectIngredientsLoading,
} from '@services/ingredients/slice';

import styles from './ingredient-page.module.css';

export const IngredientContent = (): React.JSX.Element => {
  const { id } = useParams();
  const ingredients = useAppSelector(selectIngredients);
  const isLoading = useAppSelector(selectIngredientsLoading);
  const error = useAppSelector(selectIngredientsError);
  const ingredient = ingredients.find((item) => item._id === id);

  if (isLoading && !ingredients.length) return <Preloader />;
  if (error && !ingredients.length) {
    return <p className="text text_type_main-default">{error}</p>;
  }
  if (!ingredient) {
    return <p className="text text_type_main-medium">Ингредиент не найден</p>;
  }
  return <IngredientDetails ingredient={ingredient} />;
};

export const IngredientPage = (): React.JSX.Element => (
  <main className={styles.page}>
    <h1 className="text text_type_main-large mb-6">Детали ингредиента</h1>
    <IngredientContent />
  </main>
);
