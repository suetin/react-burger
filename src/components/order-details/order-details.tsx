import { CheckMarkIcon } from '@krgaa/react-developer-burger-ui-components';

import styles from './order-details.module.css';

const orderDetails = {
  number: '034536',
  identifierLabel: 'идентификатор заказа',
  status: 'Ваш заказ начали готовить',
  note: 'Дождитесь готовности на орбитальной станции',
};

export const OrderDetails = (): React.JSX.Element => {
  return (
    <article className={styles.details}>
      <p className={`${styles.number} text text_type_digits-large mb-8`}>
        {orderDetails.number}
      </p>
      <p className="text text_type_main-medium mb-15">{orderDetails.identifierLabel}</p>
      <div className={`${styles.icon} mb-15`}>
        <CheckMarkIcon type="primary" />
      </div>
      <p className="text text_type_main-default mb-2">{orderDetails.status}</p>
      <p className="text text_type_main-default text_color_inactive">
        {orderDetails.note}
      </p>
    </article>
  );
};
