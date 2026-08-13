import { OrderList } from '@components/order-presentation/order-presentation';
import { useAppSelector } from '@services/hooks';
import {
  selectProfileFeed,
  selectProfileFeedOrderPresentations,
} from '@services/profile-feed/slice';

import styles from './profile-orders-page.module.css';

export const ProfileOrdersPage = (): React.JSX.Element => {
  const feed = useAppSelector(selectProfileFeed);
  const presentations = useAppSelector(selectProfileFeedOrderPresentations);
  const isLoading = !feed.hasReceivedSnapshot && !feed.error;

  return (
    <div className={styles.page}>
      <h1 className="text text_type_main-large mb-6">История заказов</h1>
      <OrderList
        ariaLabel="История заказов"
        connectionStatus={feed.connectionStatus}
        emptyText="В истории пока нет заказов"
        error={feed.error}
        isLoading={isLoading}
        pathPrefix="/profile/orders"
        presentations={presentations}
        retryAttempt={feed.retryAttempt}
        showStatus
      />
    </div>
  );
};
