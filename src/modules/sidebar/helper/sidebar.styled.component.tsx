import styled from '@emotion/styled';
import { carterColors } from 'shyftlabs-dsl';

export const SidebarContainer = styled.div<{ collapsed: boolean; hasNestedSubItems: boolean }>`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: ${props => (props.collapsed ? (props.hasNestedSubItems ? '100px' : '80px') : '227px')};
  height: 100%;
  background-color: #ffffff;
  border-right: 1px solid #e0e0e0;
  transition: width 0.3s ease, height 0.3s ease;
  z-index: 101;
  overflow: visible;

  /* Responsive adjustments */
  @media (max-width: 768px) {
    width: ${props => (props.collapsed ? '60px' : '200px')};
  }

  @media (max-width: 480px) {
    width: ${props => (props.collapsed ? '50px' : '180px')};
  }

  @media (min-width: 1200px) {
    width: ${props => (props.collapsed ? (props.hasNestedSubItems ? '100px' : '80px') : '250px')};
  }
`;

export const ToggleIcon = styled.div`
  position: relative;
  bottom: 20%;
  left: 100%;
  cursor: pointer;
  width: 24px;
  height: 24px;
  background: ${carterColors['brand-600']};
  border-radius: 0px 50% 50% 0px;
  transition: opacity 0.3s ease, transform 0.3s ease;

  img {
    height: 24px;
    width: 24px;
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    width: 20px;
    height: 20px;

    img {
      height: 20px;
      width: 20px;
    }
  }

  @media (max-width: 480px) {
    width: 18px;
    height: 18px;

    img {
      height: 18px;
      width: 18px;
    }
  }
`;

export const ScrollableContent = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;

  /* Custom scrollbar styling */
  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: ${carterColors['brand-200']};
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: ${carterColors['brand-300']};
  }
`;
