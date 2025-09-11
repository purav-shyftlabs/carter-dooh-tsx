import { useSelector } from 'react-redux';
import { Snackbar } from '@/lib/material-ui';
import { IRootState } from '@/redux/reducers';
import CustomAlert from './alert.component';
import styles from './alert.module.scss';

const RMNAlert = () => {
  const { alerts } = useSelector((state: IRootState) => state.common);
  return (
    <Snackbar
      open={!!alerts?.length}
      autoHideDuration={null}
      transitionDuration={0}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      sx={{
        zIndex: 1500,
      }}
    >
      <div className={styles.container}>
        {alerts?.map((toast) => (
          <CustomAlert key={toast.id} {...toast} />
        ))}
      </div>
    </Snackbar>
  );
};

export default RMNAlert;
