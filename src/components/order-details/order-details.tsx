import { CheckMarkIcon } from '@krgaa/react-developer-burger-ui-components';

import { useAppSelector } from '@services/hooks';
import {
  selectOrderError,
  selectOrderLoading,
  selectOrderNumber,
} from '@services/order/slice';

import styles from './order-details.module.css';

export const OrderDetails = (): React.JSX.Element => {
  const errorMessage = useAppSelector(selectOrderError);
  const isLoading = useAppSelector(selectOrderLoading);
  const orderNumber = useAppSelector(selectOrderNumber);

  if (isLoading) {
    return (
      <article className={styles.details}>
        <p className="text text_type_main-medium mb-15">Оформляем заказ...</p>
      </article>
    );
  }

  if (errorMessage) {
    return (
      <article className={styles.details}>
        <p className="text text_type_main-medium mb-4">Не удалось оформить заказ</p>
        <p className="text text_type_main-default text_color_inactive">{errorMessage}</p>
      </article>
    );
  }

  return (
    <article className={styles.details}>
      <p className={`${styles.number} text text_type_digits-large mb-8`}>
        {orderNumber}
      </p>
      <p className="text text_type_main-medium mb-15">идентификатор заказа</p>
      <div className={`${styles.icon} mb-15`}>
        <CheckMarkIcon type="primary" />
      </div>
      <p className="text text_type_main-default mb-2">Ваш заказ начали готовить</p>
      <p className="text text_type_main-default text_color_inactive">
        Дождитесь готовности на орбитальной станции
      </p>
    </article>
  );
};
