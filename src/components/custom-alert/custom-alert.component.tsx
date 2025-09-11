import * as React from 'react';
import { Alert, IconButton, Snackbar } from '@/lib/material-ui';
import useAlert from '@/contexts/alert/alert.hook';
import { CloseIcon } from '@/lib/icons';
// Removed redux message dispatch; using Alert context only

const CustomAlert = () => {
  const [open, setOpen] = React.useState(false);

  const { message, variant, closeAlert, dataTestId } = useAlert();

  React.useEffect(() => {
    setOpen(Boolean(message));
  }, [message, variant]);

  const handleClose = (_event: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    closeAlert();
  };

  const action = (
    <IconButton size="small" aria-label="close" color="inherit" onClick={handleClose}>
      <CloseIcon />
    </IconButton>
  );

  return (
    <div>
      {!!variant && !!message && (
        <Snackbar
          open={open}
          autoHideDuration={5000}
          onClose={handleClose}
          action={action}
          style={{ marginTop: '45px', zIndex: 1500 }}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <Alert onClose={handleClose} severity={variant} sx={{ width: '100%' }} data-testid={dataTestId}>
            <span data-testid={dataTestId}>{message}</span>
          </Alert>
        </Snackbar>
      )}
    </div>
  );
};

export default CustomAlert;
