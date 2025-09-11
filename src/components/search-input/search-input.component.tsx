import React, { useMemo, useState } from 'react';
import debounce from 'lodash/debounce';
import { TextFieldProps, InputAdornment, CircularProgress } from '@/lib/material-ui';
import { SearchIcon } from '@/lib/icons';
import { RMNInput } from '../input';
import styles from './search-input.module.scss';

interface CustomInputClasses {
  notchedOutline?: string;
  root?: string;
}

interface SearchInputProps extends TextFieldProps<'standard'> {
  debounce?: number;
  isLoading?: boolean;
}

const SearchInput: React.FC<SearchInputProps> = (props: SearchInputProps) => {
  const { onChange, value, debounce: _debounce = undefined, isLoading = false, ...rest } = props;
  const [searchText, setSearchText] = useState<string>((value as string) ?? '');

  const debouncedFunc = useMemo(
    () =>
      debounce(search => {
        onChange?.(search);
      }, _debounce),
    [_debounce, onChange],
  );

  const handleLocalChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSearchText(event.target.value);
    if (_debounce) {
      debouncedFunc(event);
      return;
    }
    onChange?.(event);
  };

  React.useEffect(() => {
    setSearchText(value === undefined ? '' : (value as string));
  }, [value]);

  return (
    <RMNInput
      placeholder="Search"
      InputProps={{
        classes: {
          notchedOutline: styles.notched_outline,
          root: styles.root_input,
        } as CustomInputClasses,
        endAdornment: (
          <InputAdornment position="start">
            <SearchIcon width={18} height={18} color="white" />
          </InputAdornment>
        ),
        ...(isLoading && {
          endAdornment: (
            <InputAdornment position="end">
              <CircularProgress size="18px" />
            </InputAdornment>
          ),
        }),
      }}
      value={searchText}
      onChange={handleLocalChange}
      {...rest}
    />
  );
};

export default SearchInput;
