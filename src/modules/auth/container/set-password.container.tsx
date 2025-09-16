import { useRouter } from 'next/router';
import useAlert from '@/contexts/alert/alert.hook';
import { NextPageWithLayout } from '@/types/common';
import AuthLayout from '@/layouts/auth-layout/auth-layout';
import authService from '@/services/auth/auth-service';
import { AlertVariant } from '@/contexts/alert/alert.provider';
import logger from '@/common/logger';
import SetPasswordForm from '../component/set-password-form.component';

const SetPassword: NextPageWithLayout = () => {
  const { replace, pathname, query } = useRouter();
  const { showAlert } = useAlert();
  const accessToken = (query?.token as string) || '';

  const handleFormSubmit = async (password: string) => {
    try {
      await authService.resetPassword(accessToken, password);
      showAlert('Your password has been set successfully!', AlertVariant.SUCCESS);
      replace({ pathname, query: { completed: 'true' } });
    } catch (error) {
      logger.error(error);
    }
  };
  return <SetPasswordForm onFormSubmit={handleFormSubmit} />;
};

SetPassword.getLayout = page => <AuthLayout>{page}</AuthLayout>;

export default SetPassword;
