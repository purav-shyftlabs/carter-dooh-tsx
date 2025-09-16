import * as yup from 'yup';
import { EMAIL_PATTERN, PASSWORD_PATTERN } from './constants';

export const loginSchema = yup.object().shape({
  email: yup.string().matches(EMAIL_PATTERN, 'Please enter valid email').required('Please enter your email'),
  password: yup.string().required('Please enter your password'),
  rememberMe: yup.boolean(),
});

export const forgotPasswordSchema = yup.object().shape({
  username: yup.string().matches(EMAIL_PATTERN, 'Please enter valid email').required('Please enter your email'),
});

export const passwordSchema = yup.object().shape({
  password: yup
    .string()
    .required('Please enter password')
    .min(10, 'Password should have at least 10 characters')
    .matches(PASSWORD_PATTERN.hasCapital, 'Please enter at least one uppercase letter')
    .matches(PASSWORD_PATTERN.hasLowercase, 'Please enter at least one lowercase letter')
    .matches(PASSWORD_PATTERN.hasSpecial, 'Please enter at least one special character')
    .matches(PASSWORD_PATTERN.hasNumber, 'Please enter at least one number'),
  confirmPassword: yup
    .string()
    .required('Please re-enter password')
    .oneOf([yup.ref('password')], 'Passwords does not match'),
});