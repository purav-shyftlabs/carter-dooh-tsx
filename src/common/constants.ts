import environments from './environments';

export const DATE_FORMAT = {
  MMM_DD_YYYY: 'MMM DD, YYYY',
  MMM_DD: 'MMM DD',
  YYYY_MM_DD: 'YYYY/MM/DD',
  YYYYMMDD: 'YYYY-MM-DD',
  MMM_DD_YYYY_HH_MM: 'MMM DD, YYYY | HH:mm',
  TIME_STAMP: 'MMM_DD_YYYY_HH_mm_ss',
  MM_D_YYYY_H_MM_A: 'MM/D/YYYY h:mm A',
  DEFAULT: 'YYYY-MM-DDTHH:mm:ss',
  DEFAULT_DATE_TIME: 'YYYY-MM-DDTHH:mm:ss',
  RFC3339: 'YYYY-MM-DDTHH:mm:ss[Z]',
  DD_MMM_YYYY: 'DD MMM, YYYY',
  MM_DD_YYYY: 'MM/DD/YYYY',
  HH_MM_A: 'hh:mm A',
  DD_MM_YYYY: 'DD/MM/YYYY',
};


export const EMAIL_PATTERN = /^[\w._%+-]+@[\w.-]+\.[a-zA-Z]{2,}$/;

export const PASSWORD_PATTERN = {
  hasNumber: /\d/,
  hasLowercase: /[a-z]/,
  hasCapital: /[A-Z]/,
  hasLength: /.{10,}/,
  hasSpecial: /[~`!@#$%^&*()_\-+={}[\]|\\:;"'<,>.?]/,
};


export const CHARACTER_LIMIT = {
  inputMax: 'can not exceed 256 characters',
  textAreaMax: 'can not exceed 1000 characters',
};

export enum AGENT {
  WEB = 'web',
  MOBILE = 'mobile',
}

export const NUMERIC_ROUNDING_TWO_TOOLTIP = 'Values are rounded to two decimal places. Hover over a value to see the full number.';