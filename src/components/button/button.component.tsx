import React, { ButtonHTMLAttributes } from 'react';
import classNames from 'classnames';
import { colors } from '@/lib/material-ui/theme';
import { useTheme } from '@/contexts/theme/useTheme.hook';
import styles from './button.module.scss';

type TButtonVariant =
  | 'primary'
  | 'secondary'
  | 'text'
  | 'info-secondary'
  | 'danger'
  | 'danger-secondary'
  | 'login-primary';

export interface IButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: TButtonVariant;
  IconComponent?: React.ElementType;
  iconPosition?: 'start' | 'end';
  title?: string;
  tooltip?: string;
}

const Button: React.FC<IButtonProps> = props => {
  const selectedColor = useTheme();
  const {
    title = '',
    tooltip,
    variant = 'text',
    IconComponent,
    iconPosition = 'start',
    className = '',
    ...restProps
  } = props;
  const primaryColorDefault = selectedColor.themeColorPrimaryDefault ?? colors.primaryDefault;
  const secondaryColorDefault = selectedColor.themeColorSecondaryDefault ?? colors.secondaryDefault;
  return (
    <button
      data-reverse={iconPosition === 'end'}
      className={classNames(styles.container, styles[variant], className ?? '')}
      title={tooltip || title}
      style={{
        ...(restProps.style ?? {}),
        ...(variant === 'primary' && {
          backgroundColor: primaryColorDefault,
        }),
        ...(variant == 'text' && {
          color: secondaryColorDefault,
        }),
      }}
      {...restProps}
    >
      {IconComponent && <IconComponent />}
      {!!title && <p>{title}</p>}
    </button>
  );
};

export default Button;
