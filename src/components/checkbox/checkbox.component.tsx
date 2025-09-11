import { CheckboxProps } from '@mui/material';
import { SwitchBaseProps } from '@mui/material/internal/SwitchBase';
import { Checkbox } from '@/lib/material-ui';
import styles from './checkbox.module.scss';

interface ICheckBox {
  testId?: string;
  label?: string;
  labelClass?: string;
  checked: boolean;
  checkboxProps?: Omit<CheckboxProps, 'onChange' | 'checked'>;
  hideCheckbox?: boolean;
  onChange: SwitchBaseProps['onChange'];
  className?: string;
}

const CheckBox: React.FC<ICheckBox> = props => {
  const {
    testId,
    checkboxProps,
    checked,
    label,
    labelClass = '',
    className = '',
    onChange,
    hideCheckbox = false,
  } = props;

  return (
    <div className={`${styles.container} ${className}`} data-disabled={checkboxProps?.disabled}>
      {!hideCheckbox && (
        <Checkbox
          {...checkboxProps}
          checked={checked}
          className={`${styles.checkbox} ${checkboxProps?.className}`}
          onChange={onChange}
          data-testid={testId}
        />
      )}
      {label && <span className={`${styles.label} ${labelClass}`}>{label}</span>}
    </div>
  );
};

export default CheckBox;
