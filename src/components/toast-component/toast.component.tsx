import React, { useState, useEffect } from 'react';
import { Snackbar, IconButton } from '@/lib/material-ui';
import { CloseIcon } from '@/lib/icons';
import styles from './toast.module.scss';

interface ToastComponentProps {
  message: string;
  verticalPosition: 'top' | 'bottom';
  horizontalPosition: 'left' | 'right';
  variant: 'default' | 'success' | 'warning' | 'error' | 'info';

  onClose?: () => void;
}

const ToastComponent: React.FC<ToastComponentProps> = props => {
  const { message, verticalPosition, horizontalPosition, variant, onClose } = props;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (message) {
      setOpen(true);
    }
  }, [message]);

  const handleClose = () => {
    setOpen(false);
    if (onClose) onClose();
  };

  const action = (
    <IconButton size="small" aria-label="close" color="inherit" onClick={handleClose}>
      <CloseIcon fontSize="small" />
    </IconButton>
  );

  return (
    <div className={styles.mainContainer}>
      <Snackbar
        open={open}
        autoHideDuration={6000}
        anchorOrigin={{ vertical: verticalPosition, horizontal: horizontalPosition }}
        onClose={handleClose}
        message={message}
        action={action}
        ContentProps={{ classes: { root: `${styles.toastContainer} ${[variant]}` } }}
      />
    </div>
  );
};

export default ToastComponent;
