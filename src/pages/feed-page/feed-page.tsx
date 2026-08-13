import {
  OrderList,
  OrderStatistics,
  OrderStatusBoard,
} from '@components/order-presentation/order-presentation';
import { useAppSelector } from '@services/hooks';
import {
  selectPublicFeed,
  selectPublicFeedOrderPresentations,
} from '@services/public-feed/slice';

import styles from './feed-page.module.css';

export const FeedPage = (): React.JSX.Element => {
  const feed = useAppSelector(selectPublicFeed);
  const presentations = useAppSelector(selectPublicFeedOrderPresentations);
  const isLoading = !feed.hasReceivedSnapshot && !feed.error;
  const displayedOrders = presentations.map((presentation) =>
    presentation.state === 'ready' ? presentation.value.order : presentation.order
  );

  return (
    <main className={styles.page}>
      <h1 className="text text_type_main-large mb-5">Лента заказов</h1>
      <div className={styles.content}>
        <OrderList
          ariaLabel="Лента заказов"
          connectionStatus={feed.connectionStatus}
          emptyText="Заказов пока нет"
          error={feed.error}
          isLoading={isLoading}
          pathPrefix="/feed"
          presentations={presentations}
          retryAttempt={feed.retryAttempt}
        />
        <aside className={styles.summary} aria-label="Сводка заказов">
          <OrderStatusBoard orders={displayedOrders} />
          <OrderStatistics total={feed.total} totalToday={feed.totalToday} />
        </aside>
      </div>
    </main>
  );
};
