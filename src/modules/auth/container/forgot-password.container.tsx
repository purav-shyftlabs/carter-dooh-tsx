import AuthLayout from '@/layouts/auth-layout/auth-layout';
import { NextPageWithLayout } from '@/types/common';
import ForgotPasswordForm from '../component/forgot-password-form.component';

const ForgotPassword: NextPageWithLayout = () => {
  return <ForgotPasswordForm />;
};

ForgotPassword.getLayout = page => <AuthLayout>{page}</AuthLayout>;

export default ForgotPassword;
