import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Typography } from 'shyftlabs-dsl';
import { Popover, useMediaQuery } from '@mui/material';
import ROUTES from '@/common/routes';
import { useSidebarMenuList, isActiveRoute } from '../helper/sidebar.helper';
import SidebarSection from '../components/sidebar-section.component';
import styles from '../styles/sidebar.module.scss';
import { SidebarContainer, ScrollableContent, ToggleIcon } from '../helper/sidebar.styled.component';

const SidebarComponent = () => {
  const [expandedItems, setExpandedItems] = useState(new Set());
  const router = useRouter();
  const sidebarRef = useRef(null);
  const isLowHeight = () => useMediaQuery(`(max-height: 600px)`);

  const isActive = (link) => isActiveRoute(router, link);

  const [popperItem, setPopperItem] = useState();

  const isInsightActive = (id) => router.asPath === `/insights/${id}`;

  const handleItemClick = (item) => {
    if (isSidebarCollapsed && Number(item.subCategories?.length) > 0 && !popperItem) {
      // Don't do anything here, let hover handle it
      return;
    }
    if (item.link === ROUTES.INSIGHTS && item.subCategories && item.subCategories.length > 0) {
      router.push(`${ROUTES.INSIGHTS}/${item.subCategories[0].id}`);
    } else {
      router.push(item.link);
    }
  };

  const toggleSubItems = (id) => {
    setExpandedItems(prev => {
      const newSet = new Set();
      if (prev.has(id)) {
        // If clicking on already expanded item, collapse it
        return newSet;
      } else {
        // If expanding a new item, collapse all others and expand only this one
        newSet.add(id);
        return newSet;
      }
    });
  };

  const { MenuItems } = useSidebarMenuList();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const getActiveSubItemIndex = (subCategories) => {
    if (!subCategories) return -1;
    return subCategories.findIndex(subItem => isActive(subItem.link));
  };

  useEffect(() => {
    MenuItems.forEach((item) => {
      if (item.subCategories?.some((subItem) => isActiveRoute(router, subItem.link))) {
        setExpandedItems(prev => new Set(prev).add(item.id));
        return;
      }

      if (item.subCategories?.length > 0) {
        const isOnRelatedPage = item.subCategories.some((subItem) => isActiveRoute(router, subItem.link));
        if (isOnRelatedPage) {
          setExpandedItems(prev => new Set(prev).add(item.id));
        }
      }
    });
  }, [router.asPath]);

  const handleInsightSubItemClick = (id) => {
    const basePath = '/insights';
    const path = `${basePath}/${id}`;
    router.push(path);
  };

  const handlePopperClose = () => {
    setPopperItem(undefined);
  };

  // Single event handler for the entire sidebar
  useEffect(() => {
    if (!isSidebarCollapsed || !sidebarRef.current) return;

    let hoverTimeout;
    let isOverPopover = false;

    const handleMouseOver = (e) => {
      const target = e.target;
      const itemContainer = target.closest('[data-sidebar-item]');

      if (!itemContainer) return;

      const itemId = itemContainer.getAttribute('data-item-id');
      const item = MenuItems.find(menuItem => menuItem.id.toString() === itemId);

      if (item && item.subCategories && item.subCategories.length > 0) {
        clearTimeout(hoverTimeout);
        setPopperItem({ ...(item), anchorEl: itemContainer });
      }
    };

      const handleMouseOut = (e) => {
      const relatedTarget = e.relatedTarget;

      // Check if we're moving to the popover
      if (
        relatedTarget &&
        (relatedTarget.closest('[role="presentation"]') || relatedTarget.closest('.MuiPopover-paper'))
      ) {
        isOverPopover = true;
        return;
      }

      // If not moving to popover, close after delay
      hoverTimeout = setTimeout(() => {
        if (!isOverPopover) {
          setPopperItem(undefined);
        }
      }, 100);
    };

    const sidebar = sidebarRef.current;
    sidebar.addEventListener('mouseover', handleMouseOver);
    sidebar.addEventListener('mouseout', handleMouseOut);

    return () => {
      sidebar.removeEventListener('mouseover', handleMouseOver);
      sidebar.removeEventListener('mouseout', handleMouseOut);
      clearTimeout(hoverTimeout);
    };
  }, [isSidebarCollapsed, MenuItems]);

  const sidebarSectionProps = {
    getActiveSubItemIndex,
    expandedItems,
    collapsed: isSidebarCollapsed,
    isSidebarCollapsed,
    isActive,
    toggleSubItems,
    handleItemClick,
    isInsightActive,
    handleInsightSubItemClick,
  };

  return (
    <>
      <SidebarContainer
        ref={sidebarRef}
        collapsed={isSidebarCollapsed}
        data-testId=""
        hasNestedSubItems={MenuItems.filter(item => item.hasOwnProperty('subCategories')).length > 0}
      >
        <ScrollableContent>
          <SidebarSection
            menuItems={MenuItems.filter(el => el.id < 90 && el.position !== 'bottom')}
            {...sidebarSectionProps}
          />
          <SidebarSection
            menuItems={MenuItems.filter(el => el.id > 90 && el.position !== 'bottom')}
            {...sidebarSectionProps}
          />
          <SidebarSection
            menuItems={MenuItems.filter(el => el.position === 'bottom')}
            {...sidebarSectionProps}
            classNames={isLowHeight() ? styles.bottomSectionRelative : styles.bottomSection}
          />
        </ScrollableContent>
      </SidebarContainer>

      <Popover
        open={!!popperItem?.id}
        anchorEl={popperItem?.anchorEl}
        anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
        transformOrigin={{ vertical: 'center', horizontal: 'left' }}
        onClose={handlePopperClose}
        disableRestoreFocus
        disableAutoFocus
        PaperProps={{
          onMouseEnter: () => {
            // Keep popover open when hovering over it
          },
          onMouseLeave: () => {
            setPopperItem(undefined);
          },
          style: {
            marginLeft: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            borderRadius: '8px',
          },
        }}
      >
        <div className={styles.popper_menu_container}>
          {popperItem?.subCategories
            ?.filter(subItem => subItem.show !== false)
            ?.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (popperItem.link === ROUTES.INSIGHTS) {
                    handleInsightSubItemClick(item.id);
                  } else {
                    handleItemClick(item);
                  }
                  handlePopperClose();
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = '#f2f2fd';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Typography variant="body-regular">{item.label}</Typography>
              </button>
            ))}
        </div>
      </Popover>

      <ToggleIcon
        data-testid="toggle-sidebar"
        onMouseDown={() => {
          setIsSidebarCollapsed(!isSidebarCollapsed);
        }}
        tabIndex={0}
        role="button"
        onClick={() => {
          setIsSidebarCollapsed(!isSidebarCollapsed);
        }}
      >
        {!isSidebarCollapsed ? (
          <ChevronLeftIcon height={24} width={24} color="#FFF" />
        ) : (
          <ChevronRightIcon height={24} width={24} color="#FFF" />
        )}
      </ToggleIcon>
    </>
  );
};

export default SidebarComponent;
