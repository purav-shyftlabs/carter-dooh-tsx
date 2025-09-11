import { useFormik } from 'formik';
import Image from 'next/image';
import { useState } from 'react';
import { carterColors, CarterInput, Typography, Button } from 'shyftlabs-dsl';
import Link from 'next/link';
import { forgotPasswordSchema } from '@/common/schemas.yup';
import EmailSentIcon from '@/assets/images/mail_folder.png';
import authService from '@/services/auth/auth-service';
import useAlert from '@/contexts/alert/alert.hook';
import { AlertVariant } from '@/contexts/alert/alert.provider';
import ROUTES from '@/common/routes';
import styles from '../styles/forgot-password.module.scss';
import useConfigs from '@/contexts/app-configs/app-configs.hooks';

const ForgotPasswordForm = () => {
  const [isEmailSent, setIsEmailSent] = useState<boolean>(false);
  const { client } = useConfigs();
  const { showAlert } = useAlert();
  const [error, setError] = useState<string>();
  // use exported singleton

  const { values, errors, handleSubmit, handleChange } = useFormik({
    initialValues: {
      username: '',
    },
    validationSchema: forgotPasswordSchema,
    onSubmit: async ({ username }) => {
      try {
        await authService.forgotPassword(username);
        showAlert('An email has been sent to you to reset your password', AlertVariant.SUCCESS);
        setIsEmailSent(true);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Something went wrong';
        setError(message);
      }
    },
  });

  const getCodedEmail = () => {
    const [local, domain] = values.username.split('@');

    if (local.length <= 2) return `${local[0]}*@${domain}`;

    const codedLocal = `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}`;
    return `${codedLocal}@${domain}`;
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit}>
        {!isEmailSent ? (
          <div className={styles.body}>
            <div className={styles.header}>
              <Typography fontFamily="Roboto" variant="h2-bold" color={carterColors['brand-900']}>
                Forgot Password?
              </Typography>
              <Typography fontFamily="Roboto" variant="body-medium" color={carterColors['text-600']}>
                Enter your email to reset password
              </Typography>
            </div>
            <div className={styles.form_field}>
              <CarterInput
                type="text"
                name="username"
                labelProps={{
                  label: 'Email Address',
                }}
                placeholder="Enter your email"
                error={!!errors.username || !!error}
                errorMessage={errors.username ?? error}
                value={values.username}
                onChange={handleChange}
              />
              <Button
                className={styles.submit_button}
                label="Contine"
                variant="primary"
                type="submit"
                disabled={!(!errors.username && values.username.length > 0)}
              />
              <Link href={ROUTES.AUTH.LOGIN}>
                <Typography fontFamily="Roboto" variant="body-large-semibold" color={carterColors['brand-600']}>
                  Back to log in
                </Typography>
              </Link>
            </div>
            <div className={styles.formFooter}>
              <Link href={client?.website ?? ''} color={carterColors['links-blue']}>
                <Typography fontFamily="Roboto" color={carterColors['links-blue']}>Visit Website</Typography>
              </Link>
              <Link href={client?.termsAndCondition ?? ''} color={carterColors['links-blue']}>
                <Typography fontFamily="Roboto" color={carterColors['links-blue']}>Terms & Conditions</Typography>
              </Link>
              <Link href={client?.privacyPolicy ?? ''} color={carterColors['links-blue']}>
                <Typography fontFamily="Roboto" color={carterColors['links-blue']}>Privacy Policy</Typography>
              </Link>
            </div>
          </div>
        ) : (
          <div className={styles.body}>
            <Image src={EmailSentIcon} alt="email-sent-icon" />
            <div className={styles.notice_field}>
              <Typography fontFamily="Roboto" variant="h1-bold" color={carterColors['brand-900']}>
                Please verify your email
              </Typography>
              <Typography fontFamily="Roboto">{`We've sent a reset link to ${getCodedEmail()}`}</Typography>
            </div>
            <div className={styles.notice_field}>
              <Button className={styles.submit_button} label="Resend Email" variant="primary" type="submit" />
              <Typography fontFamily="Roboto" variant="caption-regular">
                If in case you don&apos;t see in your inbox, check your spam or junk folder
              </Typography>
            </div>
            <Link href={ROUTES.AUTH.LOGIN}>
              <Typography fontFamily="Roboto" variant="body-large-semibold" color={carterColors['brand-600']}>
                Back to log in
              </Typography>
            </Link>
            <div className={styles.formFooter}>
              <Link href={client?.website ?? ''} color={carterColors['links-blue']}>
                <Typography fontFamily="Roboto" color={carterColors['links-blue']}>Visit Website</Typography>
              </Link>
              <Link href={client?.termsAndCondition ?? ''} color={carterColors['links-blue']}>
                <Typography fontFamily="Roboto" color={carterColors['links-blue']}>Terms & Conditions</Typography>
              </Link>
              <Link href={client?.privacyPolicy ?? ''} color={carterColors['links-blue']}>
                <Typography fontFamily="Roboto" color={carterColors['links-blue']}>Privacy Policy</Typography>
              </Link>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default ForgotPasswordForm;
