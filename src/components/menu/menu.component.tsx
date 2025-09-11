import React, { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { Typography } from 'shyftlabs-dsl';
import { MoreHorizontalIcon, CheckIcon } from '@/lib/icons';
import optionSelectStyles from '../roles-permissions-component/permissions.module.scss';

const MoreMenu: React.FC<MoreMenuProps> = props => {
  const { options = [], Icon = null, activeOption = null, stopPropagation = false, fallback = '' } = props;
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const [selectedOption, setSelectedOption] = useState<string | null | undefined>(activeOption);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (stopPropagation) {
      event.stopPropagation();
    }
    setAnchorEl(event.currentTarget);
  };
  const handleClose = (event?: React.MouseEvent<HTMLElement>) => {
    if (stopPropagation) {
      event?.stopPropagation();
    }
    setAnchorEl(null);
  };

  const handleOptionSelect = (option: MenuItemProps, event?: React.MouseEvent<HTMLElement>) => {
    setSelectedOption(option.label);
    handleClose(event);
    if (option.onClick) {
      option.onClick(option.label);
    }
  };

  if (!options.length) {
    return <Typography fontFamily="Roboto">{fallback}</Typography>;
  }

  return (
    <div data-testid="campaign-more-options-button">
      {Icon ? (
        <div onClick={handleClick}>
          <Icon />
        </div>
      ) : (
        <IconButton onClick={handleClick}>
          <MoreHorizontalIcon />
        </IconButton>
      )}
      <Menu
        id="long-menu"
        MenuListProps={{
          'aria-labelledby': 'long-button',
        }}
        anchorEl={anchorEl}
        open={open}
        onClose={(_, __) => handleClose()}
      >
        {options.map((option, index) => (
          <MenuItem
            key={index}
            disabled={option.disabled ?? false}
            data-testid={option['data-testid']}
            onClick={event => handleOptionSelect(option, event)} // Call handleOptionSelect with the selected option
            selected={option.label === selectedOption} // Add selected prop to highlight the selected option
          >
            {option.apply ? option.apply(option.label) : <Typography fontFamily="Roboto">{option.label}</Typography>}
            {option.label === selectedOption && option.showCheckmark && (
              <CheckIcon className={optionSelectStyles.checkmarkIcon} />
            )}
            {/* CheckIcon next to selected option */}
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
};

interface MenuItemOnClick {
  (itemSelected: string, event?: React.MouseEvent<HTMLElement>): void;
}
interface MenuItemProps {
  label: string;
  disabled?: boolean;
  apply?: (label: string) => React.ReactNode;
  onClick?: MenuItemOnClick;
  showCheckmark?: boolean;
  'data-testid'?:string;
}

interface MoreMenuProps {
  options?: Array<MenuItemProps>;
  activeOption?: string | null;
  Icon?: React.ElementType | null;
  stopPropagation?: boolean;
  fallback?: string;
}

 

export default MoreMenu;
