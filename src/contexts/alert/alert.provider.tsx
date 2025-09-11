import React, { useState, useMemo, useCallback, PropsWithChildren } from 'react';
import CustomAlert from '@/components/custom-alert/custom-alert.component';

export enum AlertVariant {
  ERROR = 'error',
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
}

export interface AlertContextInterface {
  variant?: AlertVariant;
  message: string;
  dataTestId?: string;
  showAlert: (message: string, variant?: AlertVariant, dataTestId?: string) => void;
  closeAlert: () => void;
}

export const AlertContext = React.createContext<AlertContextInterface>({
  variant: AlertVariant.INFO,
  message: '',
  dataTestId: '',
  showAlert: () => {},
  closeAlert: () => {},
});

const AlertProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [alert, setAlert] = useState<{
    variant?: AlertVariant;
    message: string;
    dataTestId?: string;
  }>({
    variant: AlertVariant.INFO,
    message: '',
    dataTestId: '',
  });

  const closeAlert = useCallback(() => {
    setAlert({ message: '', variant: undefined });
  }, []);

  const showAlert = useCallback((message: string, variant = AlertVariant.INFO, dataTestId?: string) => {
    setAlert({ message, variant, dataTestId });
  }, []);

  const contextValue: AlertContextInterface = useMemo(
    () => ({
      message: alert.message,
      variant: alert.variant,
      showAlert,
      closeAlert,
      dataTestId:alert.dataTestId,
    }),
    [alert, showAlert, closeAlert],
  );

  return (
    <AlertContext.Provider value={contextValue}>
      {children}
      <CustomAlert />
    </AlertContext.Provider>
  );
};

export default AlertProvider;
