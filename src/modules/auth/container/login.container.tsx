import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAppSelector } from '@/redux/hooks';
import LoginForm from '../component/login-form.component';
import styles from '../styles/login.module.scss';
import billboard from '@/assets/images/billboardOld.png';
import Head from 'next/head';
import { Typography } from 'shyftlabs-dsl';
import { carterColors } from 'shyftlabs-dsl';
import Link from 'next/link';
import logo from '@/assets/images/logo.png';
const Login = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAppSelector(state => state.auth);
  const { client } = { client: { name: 'Carter', logo: logo, appSnapshotImage: billboard.src, tag: 'Welcome back!', website: 'https://www.google.com', termsAndCondition: 'https://www.google.com', privacyPolicy: 'https://www.google.com' } };

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  // Don't render if user is authenticated (will redirect)
  if (isAuthenticated) {
    router.replace('/dashboard');
  }

  return (
    <div className={styles.pageContainer}>
      <Head>
        <title>{`${!isLoading ? client?.name : ''} Welcome Back`}</title>
      </Head>
      <div className={styles.leftContainer}>
        <div className={styles.header}>
          {client?.logo && <img src={client?.logo.src} height={90} width={200} alt="logo" />}
        </div>
        <div className={styles.imageContainer}>
          <img src={client?.appSnapshotImage} alt="Dashboard Image" />
        </div>
      </div>

      <div className={styles.rightContainer} >
        <div className={styles.formContainer}>
          <div className={styles.formHeader}>
            {!isLoading ? (
              <div className={styles.welcomeTitle}>
                <div className={styles.brandIconTitle}>
                  <Typography fontFamily="Roboto"  variant="h1-bold">{client?.tag}</Typography>
                </div>
                <Typography fontFamily="Roboto"  variant="subtitle-regular" color={carterColors['text-600']}>
                  Log-in to track your performance
                </Typography>
              </div>
            ) : (
              <div className={styles.welcomeTitle}>
                <Typography fontFamily="Roboto" variant="h1-bold" color={carterColors['brand-900']}>
                  Welcome back!
                </Typography>
                <Typography fontFamily="Roboto"  variant="subtitle-regular" color={carterColors['text-600']}>
                  Log-in to track your performance
                </Typography>
              </div>
            )}
          </div>
          <div className={styles.formField}>
            <LoginForm />
            <Typography fontFamily="Roboto"  variant="body-medium">
              Optimize your retail media campaign today!{' '}
              <Link className={styles.inviteLink} href={client?.website ?? ''}>
                Get in touch
              </Link>
              .
            </Typography>


          </div>

          <div className={styles.formFooter}>
            <Link href={client?.website ?? ''} color={carterColors['links-blue']}>
              <Typography fontFamily="Roboto"  color={carterColors['links-blue']}>Visit Website</Typography>
            </Link>
            <Link href={client?.termsAndCondition ?? ''} color={carterColors['links-blue']}>
              <Typography fontFamily="Roboto"  color={carterColors['links-blue']}>Terms & Conditions</Typography>
            </Link>
            <Link href={client?.privacyPolicy ?? ''} color={carterColors['links-blue']}>
              <Typography fontFamily="Roboto"  color={carterColors['links-blue']}>Privacy Policy</Typography>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;