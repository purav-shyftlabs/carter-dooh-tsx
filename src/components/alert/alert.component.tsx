import { useState, useEffect } from 'react';
import { Snackbar } from 'shyftlabs-dsl';
import { Grow } from '@/lib/material-ui';
import { removeAlert } from '@/redux/actions';
import { AlertProps } from '@/types/common';

const TIMEOUT = 300;

const CustomAlert: React.FC<AlertProps> = props => {
  const { autoCloseDuration, id, ...toast } = props;

  const [open, setOpen] = useState<boolean>(true);

  const close = () => {
    setOpen(false);
    setTimeout(() => {
      removeAlert(id as string);
    }, TIMEOUT);
  };

  useEffect(() => {
    if (autoCloseDuration !== 0) {
      setTimeout(() => {
        close();
      }, autoCloseDuration ?? 3000);
    }
  }, [close, autoCloseDuration]);

  return (
    <Grow in={open} timeout={TIMEOUT}>
      <div>
        <Snackbar {...toast} onClose={close} />
      </div>
    </Grow>
  );
};

export default CustomAlert;
