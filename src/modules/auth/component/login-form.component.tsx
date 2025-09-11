import { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { CarterCheckbox, carterColors, CarterInput, Typography } from 'shyftlabs-dsl';
import Link from 'next/link';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { loginSchema } from '@/common/schemas.yup';
import Button from '@/components/button/button.component';
import { login, authClearError } from '@/redux/actions';
import ROUTES from '@/common/routes';
import logger from '@/common/logger';
import styles from '../styles/login-form.module.scss';
import { AlertVariant } from '@/contexts/alert/alert.provider';
import useAlert from '@/contexts/alert/alert.hook';

const LoginForm = () => {
  const { replace } = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector(state => state.auth);
  const [isVisible, setIsVisible] = useState(false);
  const { showAlert } = useAlert();
  
  const { touched, values, errors, handleChange, setFieldValue, handleSubmit, isValid, validateForm, setTouched } = useFormik({
    initialValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
    validationSchema: loginSchema,
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit: async (values) => {
      console.log('Form submitted with values:', values);
      console.log('Form is valid:', isValid);
      console.log('Form errors:', errors);
      try {
        dispatch(authClearError()); // Clear any previous errors
        console.log('Dispatching login action...');
        await dispatch(login({ email: values.email, password: values.password }));
        console.log('Login successful, redirecting...');
        replace(ROUTES.DASHBOARD);
      } catch (error) {
        console.error('Login error:', error);
      }
    },
  });

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Trigger validation for all fields
    const validationErrors = await validateForm();
    
    // Mark all fields as touched to show validation errors
    setTouched({
      email: true,
      password: true,
      rememberMe: true,
    });
    
    // Only proceed if no validation errors
    if (Object.keys(validationErrors).length === 0) {
      handleSubmit(e);
    }
  };
  useEffect(() => {
    if (error) {
      showAlert(String(error), AlertVariant.ERROR, 'login-error-toast');
    }
  }, [error, showAlert]);
  return (
    <form onSubmit={handleFormSubmit} className={`${styles.container}`}>
      
      
      
      <div className={styles.formField}>
        <Typography fontFamily="Roboto" variant="body-regular">Email Address</Typography>
        <CarterInput
          type="email"
          placeholder="Enter your Email"
          name="email"
          value={values.email}
          onChange={handleChange} 
          data-testid="login-credential-input"
          error={touched.email && !!errors.email}
          errorMessage={errors.email}
        />
      </div>
      <div className={styles.formField}>
        <div className={styles.passwordLabel}>
          <Typography fontFamily="Roboto" variant="body-regular">Password</Typography>
        </div>
        <CarterInput
          placeholder="Enter your password"
          name="password"
          value={values.password}
          onChange={handleChange}
          data-testid="login-credential-input"
          iconProps={{
            end: [
              {
                onAction: () => setIsVisible(!isVisible),
                icon: isVisible ? <EyeIcon /> : <EyeOffIcon />,
              },
            ],
          }}
          error={touched.password && !!errors.password}
          errorMessage={errors.password}
          type={isVisible ? 'text' : 'password'}
        />
        <div className={styles.passwordLabel}>
          <CarterCheckbox
            label="Remember Me"
            id="remember-me"
            variant="DEFAULT"
            checked={values.rememberMe}
            onChange={() => setFieldValue('rememberMe', !values.rememberMe)}
          />
          <Link href={ROUTES.AUTH.FORGOT_PASSWORD} color={carterColors['links-blue']}>
            <Typography fontFamily="Roboto" color={carterColors['links-blue']}  data-testid="login-forgot-password-link">
              Forgot Password?
            </Typography>
          </Link>
        </div>
      </div>
      <div className={styles.formField}></div>
      <Button 
        title={isLoading ? "Logging in..." : "Log in"} 
        variant="primary" 
        type="submit" 
        data-testid="login-submit-button" 
        className={styles.submit_button}
        disabled={isLoading}
      />
      
      {/* Debug info */}
     
    </form>
  );
};

export default LoginForm;
