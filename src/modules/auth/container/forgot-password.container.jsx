import AuthLayout from '@/layouts/auth-layout/auth-layout';
import ForgotPasswordForm from '../component/forgot-password-form.component';

const ForgotPassword = () => {
  return <ForgotPasswordForm />;
};

ForgotPassword.getLayout = page => <AuthLayout>{page}</AuthLayout>;

export default ForgotPassword;
