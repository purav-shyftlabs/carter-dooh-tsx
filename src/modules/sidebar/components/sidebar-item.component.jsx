import styled from '@emotion/styled';
import { ChevronDown, ChevronUp, CornerDownRight } from 'lucide-react';
import { useRef, useState } from 'react';
import { carterColors } from 'shyftlabs-dsl';
import useElementPosition from '@/contexts/useElementPosition/useElementPosition.hook';

const ItemContainer = styled.div`
  color: ${props => (props.active ? carterColors['brand-600'] : carterColors['text-700'])};
  font-family: inherit;
  font-size: 14px;
  font-style: normal;
  font-weight: 500;
  line-height: normal;
  padding: ${props => (props.isSubItem ? '8px 8px 8px 40px' : '8px')};
  border-radius: 3px;
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: ${props => (props.collapsed ? 'center' : 'space-between')};

  &:hover {
    color: #12297d;
    background-color: #f2f2fd;
  }

  ${props =>
    props.active &&
    `
    color: #12297d;
    background-color: #f2f2fd;
  `}
`;

const RoundedCornerIcon = styled(CornerDownRight)`
  opacity: ${props => (props.visible ? 1 : 0)};
  transition: opacity 0.2s ease;
  position: absolute;
  left: 33.6px;
`;

const MenuIcon = styled.div`
  margin-right: ${props => (props.collapsed ? '0' : '8px')};
  height: 24px;
  width: 24px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const SidebarContent = styled.div`
  display: flex;
  align-items: center;
  overflow-x: scroll;

  &::-webkit-scrollbar {
    display: none;
  }

  -ms-overflow-style: none;
  scrollbar-width: none;
`;

const MenuText = styled.span`
  opacity: ${props => (props.collapsed ? 0 : 1)};
  transition: opacity 0.2s ease;
  white-space: wrap;
`;

const StyledSubItemIndicator = styled.div`
  position: absolute;
  left: 35px;
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  width: 2px;
  background: ${carterColors['brand-600']};
  height: ${({ isActive }) => (isActive ? '20px' : '40px')};
  top: ${({ positionTop }) => `${positionTop - 4}px`};
`;

const SidebarItem = ({
  item,
  isActive,
  sidebarCollapsed = false,
  isSubItem = false,
  showSubItems,
  onToggleSubItems,
  onItemClick,
  index,
  activeSubItemIndex,
  testId,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const sideBarItemRef = useRef(null);
  const position = useElementPosition(sideBarItemRef);
  return (
    <ItemContainer
      active={isActive}
      collapsed={sidebarCollapsed}
      isSubItem={isSubItem}
      ref={sideBarItemRef}
      onClick={() => onItemClick(item.link)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <SidebarContent style={{}}>
        {item.icon && <MenuIcon collapsed={sidebarCollapsed}>{item.icon}</MenuIcon>}
        {!sidebarCollapsed && <MenuText collapsed={sidebarCollapsed} data-testid={testId}>{item.label}</MenuText>}
      </SidebarContent>
      {item.subCategories && !sidebarCollapsed && !isSubItem && (
        <div
          onClick={e => {
            e.stopPropagation();
            onToggleSubItems?.();
          }}
        >
          {showSubItems ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>
      )}
      {isSubItem && (activeSubItemIndex ?? -1) >= (index ?? -1) && (
        <StyledSubItemIndicator isActive={(activeSubItemIndex ?? -1) === (index ?? -1)} positionTop={position.top} />
      )}
      {isSubItem && !sidebarCollapsed && (
        <RoundedCornerIcon size={15} strokeWidth={3} visible={isHovered || isActive} />
      )}
    </ItemContainer>
  );
};

export default SidebarItem;
