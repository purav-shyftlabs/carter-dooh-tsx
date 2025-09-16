import { useRouter } from 'next/router';
import { useFormik } from 'formik';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { CarterInput, Typography, Button, carterColors } from 'shyftlabs-dsl';
import Link from 'next/link';
import { PASSWORD_PATTERN } from '@/common/constants';
import { passwordSchema } from '@/common/schemas.yup';
import CompleteLogo from '@/assets/images/tick.png';
import BigCross from '@/assets/images/BigCross.svg';
import { EyeIcon, EyeOffIcon } from '@/lib/icons';
import ROUTES from '@/common/routes';
import useConfigs from '@/contexts/app-configs/app-configs.hooks';
import styles from '../styles/set-password-form.module.scss';

interface ISetPasswordForm {
  isResetPassword?: boolean;
  onFormSubmit: (password: string) => void;
}

const SetPasswordForm: React.FC<ISetPasswordForm> = props => {
  const { isResetPassword, onFormSubmit } = props;
  const router = useRouter();
  const { client } = useConfigs();
  const [confirmFocused, setConfirmFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const isCompleted = router?.query?.completed === 'true';
  const isExpired = router?.query?.expired === 'true';
  const { values, touched, errors, handleBlur, handleChange, setFieldValue, handleSubmit } = useFormik({
    initialValues: {
      password: '',
      confirmPassword: '',
    },
    validationSchema: passwordSchema,
    onSubmit: ({ password }) => onFormSubmit(password),
  });

  const [showPassword, setShowPassword] = useState(true);
  const [showConfirmPassword, setShowConfirmPassword] = useState(true);

  const { title, description } = useMemo(() => {
    if (isResetPassword) {
      if (isCompleted) {
        return {
          title: 'Password Reset Successful!',
          description: 'You can now use your new password to sign in.',
        };
      }
      return {
        title: 'Reset Password',
        description: 'Create a new password for your account.',
      };
    }
    if (isCompleted) {
      return {
        title: 'Password Setup Completed!',
        description: 'Your password has been set up successfully and your account is now activated.',
      };
    }
    if (isExpired) {
      return {
        title: 'Link Expired!',
        description:
          'To reset your password, please return to the sign in page and select “Forgot Password?” to receive a new email.',
      };
    }
    return {
      title: 'Set Your Password',
      description: 'Enter a new password below to activate your account',
    };
  }, [isResetPassword, isCompleted]);

  const handleNavigateToLogin = () => {
    router.replace(ROUTES.AUTH.LOGIN);
  };

  const renderIsCompleted = () => (
    <div className={styles.completed_container}>
      <Image src={CompleteLogo} alt="Complete Logo" width={110} className={styles.completed_image} />
      <Button
        className={styles.completed_button}
        variant="primary"
        label="Continue to Sign In"
        onClick={handleNavigateToLogin}
      />
    </div>
  );

  const renderSetPasswordForm = () => (
    <form onSubmit={handleSubmit}>
      <div className={styles.form_field}>
        <CarterInput
          onFocusCapture={() => setPasswordFocused(true)}
          onBlurCapture={() => setPasswordFocused(false)}
          placeholder="Enter password here"
          name="password"
          type={!showPassword ? 'text' : 'password'}
          value={values.password}
          error={touched.password && !!errors.password}
          onBlur={handleBlur}
          errorMessage={touched.password && errors.password ? errors.password : ''}
          width={`${100}%`}
          iconProps={{
            end: [
              {
                onAction: () => setShowPassword(!showPassword),
                icon: showPassword ? <EyeIcon /> : <EyeOffIcon />,
              },
            ],
          }}
          labelProps={{
            label: 'New Password',
          }}
          onChange={({ target }) => setFieldValue('password', target.value.trim())}
        />
        {(passwordFocused || errors.password || touched.password) && values.password && (
          <div className={styles.password_strength}>
            <li data-complete={values.password.length >= 10}>At Least 10 characters</li>
            <li data-complete={PASSWORD_PATTERN.hasSpecial.test(values.password)}>Contains a special character</li>
            <li data-complete={PASSWORD_PATTERN.hasNumber.test(values.password)}>Contains a number</li>
            <li data-complete={PASSWORD_PATTERN.hasCapital.test(values.password)}>Contains a uppercase letter</li>
            <li data-complete={PASSWORD_PATTERN.hasLowercase.test(values.password)}>Contains a lowercase letter</li>
          </div>
        )}
      </div>
      <div className={styles.form_field}>
        <CarterInput
          onFocusCapture={() => setConfirmFocused(true)}
          onBlurCapture={() => setConfirmFocused(false)}
          placeholder="Enter password here"
          name="confirmPassword"
          type={!showConfirmPassword ? 'text' : 'password'}
          value={values.confirmPassword}
          error={touched.confirmPassword && !!errors.confirmPassword}
          onBlur={handleBlur}
          errorMessage={touched.confirmPassword && errors.confirmPassword ? errors.confirmPassword : ''}
          width={`${100}%`}
          iconProps={{
            end: [
              {
                onAction: () => setShowConfirmPassword(!showConfirmPassword),
                icon: showConfirmPassword ? <EyeIcon /> : <EyeOffIcon />,
              },
            ],
          }}
          labelProps={{
            label: 'Re-enter Password',
          }}
          onChange={handleChange}
        />
        {(confirmFocused || errors.confirmPassword || touched.password) && values.confirmPassword && (
          <div className={styles.password_strength}>
            {values.confirmPassword === '' ? (
              <li data-complete={values.confirmPassword !== ''}>Password is Empty</li>
            ) : (
              <li data-complete={values.confirmPassword === values.password}>Password Match</li>
            )}
          </div>
        )}
      </div>
      <Button
        data-testid="confirm-action"
        label="Confirm"
        variant="primary"
        type="submit"
        disabled={
          !(
            !errors.password &&
            !errors.confirmPassword &&
            values.confirmPassword.length > 0 &&
            values.confirmPassword === values.password
          )
        }
        className={styles.submit_button}
      />
    </form>
  );

  const authToRender = () => {
    if (isCompleted) {
      return renderIsCompleted();
    } else if (!isExpired) {
      return renderSetPasswordForm();
    } else {
      return null; // or any other default JSX element
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.title_container}>
        {isExpired && <Image src={BigCross} alt="Complete Logo" className={styles.completed_image} />}
        <Typography variant="h1-bold">{title}</Typography>
        <Typography variant="body-medium">{description}</Typography>
        {isExpired && (
          <Button
            className={styles.action_button}
            variant="primary"
            label="Return to Sign in"
            onClick={handleNavigateToLogin}
          />
        )}
      </div>
      {authToRender()}
      <div className={styles.formFooter}>
        <Link href={client?.website ?? ''} color={carterColors['links-blue']}>
          <Typography color={carterColors['links-blue']}>Visit Website</Typography>
        </Link>
        <Link href={client?.termsAndCondition ?? ''} color={carterColors['links-blue']}>
          <Typography color={carterColors['links-blue']}>Terms & Conditions</Typography>
        </Link>
        <Link href={client?.privacyPolicy ?? ''} color={carterColors['links-blue']}>
          <Typography color={carterColors['links-blue']}>Privacy Policy</Typography>
        </Link>
      </div>
    </div>
  );
};

export default SetPasswordForm;
