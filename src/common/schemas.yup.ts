import * as yup from 'yup';
import { EMAIL_PATTERN } from './constants';

export const loginSchema = yup.object().shape({
  email: yup.string().matches(EMAIL_PATTERN, 'Please enter valid email').required('Please enter your email'),
  password: yup.string().required('Please enter your password'),
  rememberMe: yup.boolean(),
});

export const forgotPasswordSchema = yup.object().shape({
  username: yup.string().matches(EMAIL_PATTERN, 'Please enter valid email').required('Please enter your email'),
});