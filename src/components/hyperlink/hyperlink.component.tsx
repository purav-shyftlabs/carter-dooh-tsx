// Hyperlink.tsx (remains mostly the same)
import { UrlObject } from 'url';
import React from 'react';
import Link from 'next/link';
import styles from './hyperlink.module.scss';

interface HyperlinkProps {
  url?: string | UrlObject;
  label?: string;
  className?: string;
  target?: any;
  testId?: any;
  title?: string;
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: 'primary' | 'link' | 'secondary' | 'success' | 'error' | 'warning' | 'info' | 'black';
}

const Hyperlink: React.FC<HyperlinkProps> = props => {
  const {
    url = '',
    label = '',
    className = '',
    title = '',
    target = undefined,
    testId = '',
    fontWeight = 'normal',
    color = 'primary',
  } = props;

  const combinedClasses = `${styles.container} ${styles[`font-${fontWeight}`]} ${
    styles[`color-${color}`]
  } ${className}`;

  if (!url) {
    return <span className={combinedClasses}>{label}</span>;
  }

  return (
    <Link href={url} className={combinedClasses} target={target} data-testid={testId}>
      <span title={title}>{label} </span>
    </Link>
  );
};

export default Hyperlink;
