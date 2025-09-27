import React from 'react';
import styles from '../styles/progress-bar.module.scss';

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  size = 'medium',
  variant = 'primary',
  className = '',
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={`${styles.progressBar} ${styles[size]} ${styles[variant]} ${className}`}>
      <div 
        className={styles.progressFill}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};
