import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import useAlert from '@/contexts/alert/alert.hook';
import { AlertVariant } from '@/contexts/alert/alert.provider';
import { IRootState } from '../../redux/reducers';

const ToastMessage = () => {
  const message = useSelector((state: IRootState) => state.common.message);
  const { showAlert } = useAlert();
  useEffect(() => {
    if (message) {
      showAlert(message, AlertVariant.ERROR);
    }
  }, [message]);
  return null;
};

export default ToastMessage;
