import React from 'react';
import styled from '@emotion/styled';
import { ChevronDown } from 'lucide-react';
import { Menu } from '@/lib/material-ui';
import useUser from '@/contexts/user-data/user-data.hook';

const ProfileSection = styled.div`
  font-family: 'Roboto', sans-serif;
  display: flex;
  gap: 8px;
  align-items: center;
  background-color: #121f69;
  border-radius: 6px;
  border: none;
  font-weight: 500;
`;

const Avatar = styled.div`
  padding: 4px 12px;
  border-radius: 6px;
  background-color: #121f69;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
`;

const UserBreadCrumbs = styled.div`
  width: 100%;
  overflow-x: auto;
`;

const Name = styled.div`
  font-size: 12px;
  line-height: 16px;
  font-weight: 500;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const IconButton = styled.button`
  all: unset;
  display: flex;
  color: #0c1646;
  justify-content: space-between;
  margin-left: auto;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;

  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
  }
`;

const PlaceholderText = styled.span`
  color: #9ca3af;
  font-style: italic;
`;

const MoreMenuContainer = styled.div`
  position: relative;
`;

interface MoreMenuProps {
  options: Array<{
    label: string;
    onClick: () => void;
  }>;
  Icon?: React.ComponentType;
  anchorEl: HTMLElement | null;
  setAnchorEl: (el: HTMLElement | null) => void;
}

const MoreMenu: React.FC<MoreMenuProps> = ({ options, anchorEl, setAnchorEl }) => {
  return (
    <MoreMenuContainer>
      <IconButton onClick={({ currentTarget }) => setAnchorEl(currentTarget)} data-testid="logout-arrow-button">
        <ChevronDown color="#FFF" size={16} />
      </IconButton>
      <Menu open={!!anchorEl} onClose={() => setAnchorEl(null)} anchorEl={anchorEl}>
        {options.map((option, index) => (
          <MenuItem
            key={index}
            onClick={option.onClick}
            data-testid={option.label == 'Logout' ? 'logout-link' : undefined}
          >
            {option.label}
          </MenuItem>
        ))}
      </Menu>
    </MoreMenuContainer>
  );
};

const MenuItem = styled.div`
  padding: 8px 16px;
  cursor: pointer;
  white-space: nowrap;
  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
  }
`;

interface UserProfileProps {
  isLoading?: boolean;
  logout: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ isLoading, logout }) => {
  const { user } = useUser();
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  return (
    <ProfileSection id="user-profile">
      <IconButton
        onClick={({ currentTarget }) => setAnchorEl(currentTarget)}
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
      >
        <Avatar>{user?.username?.[0] ?? ''}</Avatar>

        <UserBreadCrumbs>
          <Name>
            {isLoading && !user?.name ? (
              <PlaceholderText>Fetching name...</PlaceholderText>
            ) : (
              <span title={user?.username ?? ''}>{user?.username}</span>
            )}
          </Name>
        </UserBreadCrumbs>
      </IconButton>
      <MoreMenu
        options={[
          {
            label: 'Logout',
            onClick: logout,
          },
        ]}
        Icon={() => <ChevronDown size={16} />}
        anchorEl={anchorEl}
        setAnchorEl={setAnchorEl}
      />
    </ProfileSection>
  );
};

export default UserProfile;


