import { CloseIcon } from '@krgaa/react-developer-burger-ui-components';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

import { ModalOverlay } from '@components/modal-overlay/modal-overlay';

import type { ReactNode } from 'react';

import styles from './modal.module.css';

type TModalProps = {
  title?: string;
  children: ReactNode;
  onClose: () => void;
};

export const Modal = ({
  title = '',
  children,
  onClose,
}: TModalProps): React.JSX.Element => {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return (): void => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return createPortal(
    <>
      <ModalOverlay onClose={onClose} />
      <section className={styles.modal} aria-modal="true" role="dialog">
        <header className={styles.header}>
          {title && <h2 className="text text_type_main-large">{title}</h2>}
          <button
            className={styles.close}
            type="button"
            aria-label="Закрыть"
            onClick={onClose}
          >
            <CloseIcon type="primary" />
          </button>
        </header>
        {children}
      </section>
    </>,
    document.body
  );
};
