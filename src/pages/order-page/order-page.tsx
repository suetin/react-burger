import { Button } from '@krgaa/react-developer-burger-ui-components';
import { useParams } from 'react-router-dom';

import {
  ModalOrderInformation,
  StandaloneOrderInformation,
} from '@components/order-presentation/order-presentation';
import { useOrderDetailResolution } from '@pages/order-page/use-order-detail-resolution';

import type {
  TOrderDetailResolution,
  TOrderRouteScope,
} from '@services/order-details/selectors';

import styles from './order-page.module.css';

export type { TOrderRouteScope } from '@services/order-details/selectors';

type TOrderContentProps = {
  scope: TOrderRouteScope;
  variant?: 'modal' | 'standalone';
};

type TOrderDetailStateProps = {
  id: string;
  onRetry: () => void;
  resolution: Exclude<TOrderDetailResolution, { state: 'order' }>;
  variant: NonNullable<TOrderContentProps['variant']>;
};

const OrderDetailState = ({
  id,
  onRetry,
  resolution,
  variant,
}: TOrderDetailStateProps): React.JSX.Element => {
  const content = (
    <section className={styles.fallback} aria-label="Информация о заказе">
      <p className="text text_type_digits-default">#{id || '—'}</p>
      {resolution.state === 'loading' && (
        <p className="text text_type_main-medium text_color_inactive mt-6" role="status">
          Загружаем данные заказа…
        </p>
      )}
      {resolution.state === 'not-found' && (
        <p className="text text_type_main-medium text_color_inactive mt-6" role="alert">
          Заказ не найден
        </p>
      )}
      {resolution.state === 'request-error' && (
        <>
          <p
            className="text text_type_main-medium text_color_inactive mt-6 mb-6"
            role="alert"
          >
            Не удалось загрузить заказ
          </p>
          {resolution.canRetry && (
            <Button htmlType="button" size="medium" type="primary" onClick={onRetry}>
              Повторить
            </Button>
          )}
        </>
      )}
    </section>
  );

  return variant === 'standalone' ? (
    <main className={styles.standaloneFallback}>
      <h1 className="text text_type_main-large mb-6">Детали заказа</h1>
      {content}
    </main>
  ) : (
    content
  );
};

export const OrderContent = ({
  scope,
  variant = 'modal',
}: TOrderContentProps): React.JSX.Element => {
  const { id = '' } = useParams();
  const { resolution, retry } = useOrderDetailResolution(scope, id);

  if (resolution.state === 'order') {
    return variant === 'standalone' ? (
      <StandaloneOrderInformation presentation={resolution.presentation} showStatus />
    ) : (
      <ModalOrderInformation presentation={resolution.presentation} showStatus />
    );
  }

  return (
    <OrderDetailState
      id={id}
      onRetry={retry}
      resolution={resolution}
      variant={variant}
    />
  );
};

export const OrderPage = ({ scope }: TOrderContentProps): React.JSX.Element => (
  <OrderContent scope={scope} variant="standalone" />
);
