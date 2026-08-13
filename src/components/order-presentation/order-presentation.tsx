import { CurrencyIcon } from '@krgaa/react-developer-burger-ui-components';
import { useId } from 'react';
import { Link, useLocation } from 'react-router-dom';

import {
  formatOrderTimestamp,
  getIngredientStack,
  getOrderNumberColumns,
} from '@utils/order-format';

import type { TFeedConnectionStatus } from '@services/feed/types';
import type {
  TOrder,
  TOrderPresentationResult,
  TOrderStatusGroup,
  TOrderViewModel,
} from '@utils/order-types';

import styles from './order-presentation.module.css';

type TOrderCardProps = {
  presentation: TOrderPresentationResult;
  showStatus?: boolean;
  to: string;
};

type TOrderListProps = {
  ariaLabel: string;
  connectionStatus?: TFeedConnectionStatus;
  emptyText: string;
  error?: string | null;
  isLoading?: boolean;
  pathPrefix: '/feed' | '/profile/orders';
  presentations: readonly TOrderPresentationResult[];
  retryAttempt?: number;
  showStatus?: boolean;
};

type TOrderStatusBoardProps = {
  orders: readonly TOrder[];
};

type TOrderStatisticsProps = {
  total: number;
  totalToday: number;
};

type TOrderInformationProps = {
  presentation: TOrderPresentationResult;
  showStatus?: boolean;
};

const getPresentationOrder = (presentation: TOrderPresentationResult): TOrder =>
  presentation.state === 'ready' ? presentation.value.order : presentation.order;

type TFeedDiagnostic = {
  kind: 'alert' | 'status';
  text: string;
};

const getFeedDiagnostic = ({
  connectionStatus,
  error,
  hasOrders,
  isLoading,
  retryAttempt,
}: {
  connectionStatus?: TFeedConnectionStatus;
  error: string | null;
  hasOrders: boolean;
  isLoading: boolean;
  retryAttempt: number;
}): TFeedDiagnostic | null => {
  if (connectionStatus === 'retrying') {
    return {
      kind: 'status',
      text: `Восстанавливаем соединение с лентой заказов… Попытка ${Math.max(
        retryAttempt,
        1
      )}`,
    };
  }

  if (connectionStatus === 'unavailable') {
    return { kind: 'alert', text: 'Лента заказов временно недоступна' };
  }

  if (error) {
    return { kind: 'alert', text: 'Не удалось обновить ленту заказов' };
  }

  if (connectionStatus === 'connecting') {
    return { kind: 'status', text: 'Подключаемся к ленте заказов…' };
  }

  if (isLoading && !hasOrders) {
    return { kind: 'status', text: 'Загружаем заказы…' };
  }

  return null;
};

const PresentationState = ({
  presentation,
}: Pick<TOrderCardProps, 'presentation'>): React.JSX.Element => {
  const order = getPresentationOrder(presentation);

  if (presentation.state === 'loading') {
    return (
      <p className="text text_type_main-default text_color_inactive" role="status">
        Загружаем состав заказа #{order.number}…
      </p>
    );
  }

  return (
    <p className="text text_type_main-default text_color_inactive" role="alert">
      {presentation.state === 'error'
        ? `Не удалось загрузить состав заказа #${order.number}`
        : `Состав заказа #${order.number} недоступен`}
    </p>
  );
};

const OrderStatus = ({ value }: { value: TOrderViewModel }): React.JSX.Element => (
  <p
    className={`${styles.status} ${
      value.statusGroup === 'ready' ? styles.statusReady : ''
    } text text_type_main-default mt-2`}
  >
    {value.statusText}
  </p>
);

const Price = ({
  ariaLabel,
  value,
}: {
  ariaLabel: string;
  value: number;
}): React.JSX.Element => (
  <span className={styles.price} aria-label={ariaLabel}>
    <span className="text text_type_digits-default">{value}</span>
    <CurrencyIcon type="primary" />
  </span>
);

export const OrderCard = ({
  presentation,
  showStatus = false,
  to,
}: TOrderCardProps): React.JSX.Element => {
  const location = useLocation();
  const order = getPresentationOrder(presentation);

  if (presentation.state !== 'ready') {
    return (
      <article className={styles.card} aria-label={`Заказ #${order.number}`}>
        <PresentationState presentation={presentation} />
      </article>
    );
  }

  const { resolvedIngredients, totalPrice } = presentation.value;
  const { overflowCount, visibleIngredients } = getIngredientStack(resolvedIngredients);
  const formattedDate = formatOrderTimestamp(order.createdAt);

  return (
    <article className={styles.card}>
      <Link
        className={styles.cardLink}
        to={to}
        state={{ backgroundLocation: location }}
        aria-label={`Заказ #${order.number}: ${order.name}`}
      >
        <header className={styles.cardMeta}>
          <span className="text text_type_digits-default">#{order.number}</span>
          <time
            className="text text_type_main-default text_color_inactive"
            dateTime={order.createdAt}
          >
            {formattedDate || 'Дата не указана'}
          </time>
        </header>
        <h2 className="text text_type_main-medium mt-6">{order.name}</h2>
        {showStatus && <OrderStatus value={presentation.value} />}
        <footer className={styles.cardFooter}>
          <ul className={styles.ingredientStack} aria-label="Ингредиенты заказа">
            {visibleIngredients.map((ingredient, index) => {
              const isOverflowItem =
                overflowCount > 0 && index === visibleIngredients.length - 1;

              return (
                <li
                  className={styles.ingredientStackItem}
                  key={`${ingredient._id}-${index}`}
                >
                  <img
                    className={styles.ingredientImage}
                    src={ingredient.image_mobile}
                    alt={ingredient.name}
                  />
                  {isOverflowItem && (
                    <span
                      className={`${styles.overflow} text text_type_digits-default`}
                      aria-label={`Ещё ингредиентов: ${overflowCount}`}
                    >
                      +{overflowCount}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          <Price ariaLabel={`Стоимость заказа: ${totalPrice}`} value={totalPrice} />
        </footer>
      </Link>
    </article>
  );
};

export const OrderList = ({
  ariaLabel,
  connectionStatus,
  emptyText,
  error = null,
  isLoading = false,
  pathPrefix,
  presentations,
  retryAttempt = 0,
  showStatus = false,
}: TOrderListProps): React.JSX.Element => {
  const hasOrders = presentations.length > 0;
  const diagnostic = getFeedDiagnostic({
    connectionStatus,
    error,
    hasOrders,
    isLoading,
    retryAttempt,
  });

  return (
    <section
      className={`${styles.listRegion} custom-scroll`}
      role="region"
      aria-label={ariaLabel}
      tabIndex={0}
    >
      {diagnostic && (
        <p
          className={`${styles.message} text text_type_main-default text_color_inactive`}
          role={diagnostic.kind}
        >
          {diagnostic.text}
        </p>
      )}
      {!isLoading && !error && !hasOrders && (
        <p
          className={`${styles.message} text text_type_main-default text_color_inactive`}
        >
          {emptyText}
        </p>
      )}
      {hasOrders && (
        <ul className={styles.orderList}>
          {presentations.map((presentation) => {
            const order = getPresentationOrder(presentation);

            return (
              <li key={order._id}>
                <OrderCard
                  presentation={presentation}
                  showStatus={showStatus}
                  to={`${pathPrefix}/${order._id}`}
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

const StatusColumns = ({
  columns,
  group,
}: {
  columns: readonly number[][];
  group: TOrderStatusGroup;
}): React.JSX.Element => {
  if (columns.length === 0) {
    return (
      <p className="text text_type_main-default text_color_inactive">Заказов пока нет</p>
    );
  }

  return (
    <div className={styles.statusColumns}>
      {columns.map((column, columnIndex) => (
        <ul className={styles.statusColumn} key={`${group}-${columnIndex}`}>
          {column.map((number) => (
            <li className="text text_type_digits-default" key={number}>
              {number}
            </li>
          ))}
        </ul>
      ))}
    </div>
  );
};

export const OrderStatusBoard = ({
  orders,
}: TOrderStatusBoardProps): React.JSX.Element => {
  const readyColumns = getOrderNumberColumns(orders, 'ready');
  const workColumns = getOrderNumberColumns(orders, 'work');

  return (
    <section className={styles.statusBoard} aria-label="Статусы заказов">
      <section aria-labelledby="ready-orders-heading">
        <h2 className="text text_type_main-medium mb-6" id="ready-orders-heading">
          Готовы:
        </h2>
        <div className={styles.readyOrders}>
          <StatusColumns columns={readyColumns} group="ready" />
        </div>
      </section>
      <section aria-labelledby="work-orders-heading">
        <h2 className="text text_type_main-medium mb-6" id="work-orders-heading">
          В работе:
        </h2>
        <StatusColumns columns={workColumns} group="work" />
      </section>
    </section>
  );
};

export const OrderStatistics = ({
  total,
  totalToday,
}: TOrderStatisticsProps): React.JSX.Element => (
  <section className={styles.statistics} aria-label="Статистика заказов">
    <div>
      <h2 className="text text_type_main-medium">Выполнено за всё время:</h2>
      <p
        className={`${styles.statisticsValue} text text_type_digits-large`}
        aria-label={`Выполнено за всё время: ${total}`}
      >
        {total}
      </p>
    </div>
    <div>
      <h2 className="text text_type_main-medium">Выполнено за сегодня:</h2>
      <p
        className={`${styles.statisticsValue} text text_type_digits-large`}
        aria-label={`Выполнено за сегодня: ${totalToday}`}
      >
        {totalToday}
      </p>
    </div>
  </section>
);

export const OrderInformation = ({
  presentation,
  showStatus = false,
}: TOrderInformationProps): React.JSX.Element => {
  const headingId = useId();
  const order = getPresentationOrder(presentation);

  if (presentation.state !== 'ready') {
    return (
      <article className={styles.information} aria-label={`Заказ #${order.number}`}>
        <PresentationState presentation={presentation} />
      </article>
    );
  }

  const { groupedIngredients, totalPrice } = presentation.value;
  const formattedDate = formatOrderTimestamp(order.createdAt);

  return (
    <article className={styles.information} aria-labelledby={headingId}>
      <p className={`${styles.informationNumber} text text_type_digits-default`}>
        #{order.number}
      </p>
      <h2 className="text text_type_main-medium mt-10" id={headingId}>
        {order.name}
      </h2>
      {showStatus && <OrderStatus value={presentation.value} />}
      <h3 className="text text_type_main-medium mt-15 mb-6">Состав:</h3>
      <div
        className={`${styles.compositionRegion} custom-scroll`}
        role="region"
        aria-label="Состав заказа"
        tabIndex={0}
      >
        <ul className={styles.compositionList}>
          {groupedIngredients.map(({ ingredient, quantity, unitPrice }) => (
            <li className={styles.compositionItem} key={ingredient._id}>
              <span className={styles.compositionIngredient}>
                <span className={styles.compositionImageFrame}>
                  <img
                    className={styles.compositionImage}
                    src={ingredient.image_mobile}
                    alt={ingredient.name}
                  />
                </span>
                <span className="text text_type_main-default">{ingredient.name}</span>
              </span>
              <span className={`${styles.quantity} text text_type_digits-default`}>
                {quantity} ×
              </span>
              <Price ariaLabel={`Цена за единицу: ${unitPrice}`} value={unitPrice} />
            </li>
          ))}
        </ul>
      </div>
      <footer className={styles.informationFooter}>
        <time
          className="text text_type_main-default text_color_inactive"
          dateTime={order.createdAt}
          aria-label={`Дата заказа: ${formattedDate || 'не указана'}`}
        >
          {formattedDate || 'Дата не указана'}
        </time>
        <Price ariaLabel={`Итого: ${totalPrice}`} value={totalPrice} />
      </footer>
    </article>
  );
};

export const StandaloneOrderInformation = ({
  presentation,
  showStatus = false,
}: TOrderInformationProps): React.JSX.Element => (
  <main className={styles.standaloneInformation}>
    <h1 className="text text_type_main-large mb-6">Детали заказа</h1>
    <OrderInformation presentation={presentation} showStatus={showStatus} />
  </main>
);

export const ModalOrderInformation = ({
  presentation,
  showStatus = false,
}: TOrderInformationProps): React.JSX.Element => (
  <div className={styles.modalInformation}>
    <OrderInformation presentation={presentation} showStatus={showStatus} />
  </div>
);
