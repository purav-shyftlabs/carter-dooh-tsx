import React from 'react';
import { Typography as ShyftlabsTypography, TypographyProps } from 'shyftlabs-dsl';

// Simple HTML sanitization function
const sanitizeHtml = (str: string): string => {
  if (!str || typeof str !== 'string') {
    return '';
  }

  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/\\/g, '&#x5C;')
    .replace(/\n/g, '&#x0A;')
    .replace(/\r/g, '&#x0D;')
    .replace(/\t/g, '&#x09;');
};

interface SecureTypographyProps extends Omit<Typography fontFamily="Roboto"Props, 'children'> {
  children: string | number | React.ReactNode;
  sanitizeType?: 'text' | 'number' | 'url' | 'filename';
}

const SecureTypography: React.FC<SecureTypographyProps> = ({ children, ...props }) => {
  // If children is a string or number, sanitize it
  if (typeof children === 'string' || typeof children === 'number') {
    const sanitizedContent = sanitizeHtml(String(children));
    return <ShyftlabsTypography {...props}>{sanitizedContent}</ShyftlabsTypography>;
  }

  // If children is a React node, render it as-is (assuming it's already safe)
  return <ShyftlabsTypography {...props}>{children}</ShyftlabsTypography>;
};

export default SecureTypography;
