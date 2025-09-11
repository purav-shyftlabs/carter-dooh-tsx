import { useRef } from 'react';
import { TextField, TextFieldProps } from '@/lib/material-ui';
import styles from './rmn-input.module.scss';

const UNICODE_REGEX = /[^\x00-\x7F]/g;

const RMNInput: React.FC<TextFieldProps> = props => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleInput = () => {
    const input = inputRef.current;

    if (input) {
      const newValue = input.value;
      if (newValue.match(UNICODE_REGEX)) {
        const filteredValue = newValue.replace(UNICODE_REGEX, '');
        input.value = filteredValue;
      }
    }
  };

  return (
    <TextField
      {...props}
      inputRef={inputRef}
      onInput={handleInput}
      InputProps={{
        classes: {
          notchedOutline: styles.notched_outline,
          root: styles.root,
          input: styles.input,
          disabled: styles.disabled,
        },
        ...(props.InputProps ?? {}),
      }}
      inputProps={{
        ...props.inputProps,
        maxLength: props?.inputProps?.maxLength ?? 256
      }}
    />
  );
};

export default RMNInput;
