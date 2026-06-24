import styles from './modal-overlay.module.css';

type TModalOverlayProps = {
  onClose: () => void;
};

export const ModalOverlay = ({ onClose }: TModalOverlayProps): React.JSX.Element => {
  return (
    <div className={styles.overlay} data-testid="modal-overlay" onClick={onClose} />
  );
};
