import { useContext } from 'react';
import { AlertContext } from './alert.provider';

function useAlert() {
  const { message, variant, showAlert, closeAlert, dataTestId } = useContext(AlertContext);
  return { message, variant, showAlert, closeAlert, dataTestId };
}

export default useAlert;
