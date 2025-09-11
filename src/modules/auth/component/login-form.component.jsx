import { useState } from 'react';
import { useFormik } from 'formik';
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';
import { CarterCheckbox, carterColors, CarterInput, Typography } from 'shyftlabs-dsl';
import Link from 'next/link';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { loginSchema } from '@/common/schemas.yup';
import Button from '@/components/button/button.component';
import { login, authClearError } from '@/redux/actions';
import ROUTES from '@/common/routes';
import logger from '@/common/logger';
import styles from '../styles/login-form.module.scss';

const LoginForm = () => {
  const { replace } = useRouter();
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector(state => state.auth);
  const [isVisible, setIsVisible] = useState(false);
  
  const { touched, values, errors, handleChange, setFieldValue, handleSubmit, isValid } = useFormik({
    initialValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
    validationSchema: loginSchema,
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
        logger.error('Login error:', error);
      }
    },
  });
  return (
    <form onSubmit={handleSubmit} className={`${styles.container}`}>
      {/* Display error message if login fails */}
      {error && (
        <div className={styles.errorMessage}>
          <Typography color="error" variant="body-regular">
            {error}
          </Typography>
        </div>
      )}
      
      <div className={styles.formField}>
        <Typography variant="body-regular">Email Address</Typography>
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
          <Typography variant="body-regular">Password</Typography>
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
            <Typography color={carterColors['links-blue']} variant="subtitle-small" data-testid="login-forgot-password-link">
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
