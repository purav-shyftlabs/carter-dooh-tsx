import { Tooltip, TooltipProps } from '@/lib/material-ui';
import styles from './rmn-tooltip.module.scss';

type RMNToolTipProps = TooltipProps & { variant?: 'default' | 'warning' };

const RMNToolTip: React.FC<RMNToolTipProps> = ({ variant, ...props }) => {
  return (
    <Tooltip
      {...props}
      classes={{ tooltip: variant === 'warning' ? styles.tooltip_warning : styles.tooltip, ...(props.classes ?? {}) }}
    />
  );
};

export default RMNToolTip;
