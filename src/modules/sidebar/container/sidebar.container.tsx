import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Typography } from 'shyftlabs-dsl';
import { Popover, useMediaQuery } from '@mui/material';
import ROUTES from '@/common/routes';
import { useSidebarMenuList, isActiveRoute } from '../helper/sidebar.helper';
import SidebarSection from '../components/sidebar-section.component';
import type { menuItem } from '../types/typings';
import { SidebarItemType } from '../components/sidebar-item.component';
import styles from '../styles/sidebar.module.scss';
import { SidebarContainer, ScrollableContent, ToggleIcon } from '../helper/sidebar.styled.component';

interface SubCategory { id: number; link?: string; show?: boolean; }

type ClickableItem = menuItem | { id: number; link: string; subCategories?: Array<SubCategory> };

type PopperItem = SidebarItemType & { anchorEl: HTMLElement };

const SidebarComponent: React.FC = () => {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const router = useRouter();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isLowHeight = useMediaQuery(`(max-height: 600px)`);

  const isActive = (link: string) => isActiveRoute(router, link);

  const [popperItem, setPopperItem] = useState<PopperItem>();

  const isInsightActive = (id: string) => router.asPath === `/insights/${id}`;

  const handleItemClick = (item: ClickableItem) => {
    if (
      isSidebarCollapsed &&
      Number((item as { subCategories?: Array<SubCategory> }).subCategories?.length) > 0 &&
      !popperItem
    ) {
      return;
    }
    const link = (item as { link?: string }).link ?? '';
    const subCategories = (item as { subCategories?: Array<SubCategory> }).subCategories;
    if (link === ROUTES.INSIGHTS && subCategories && subCategories.length > 0) {
      router.push(`${ROUTES.INSIGHTS}/${subCategories[0].id}`);
    } else {
      router.push(link);
    }
  };

  const toggleSubItems = (id: number) => {
    setExpandedItems(prev => {
      const newSet = new Set<number>();
      if (prev.has(id)) {
        return newSet;
      } else {
        newSet.add(id);
        return newSet;
      }
    });
  };

  const { MenuItems } = useSidebarMenuList();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const getActiveSubItemIndex = (subCategories: Array<{ link?: string }> | undefined): number => {
    if (!subCategories) return -1;
    return subCategories.findIndex(subItem => (subItem.link ? isActive(subItem.link) : false));
  };

  useEffect(() => {
    const nextExpanded = new Set<number>();
    (MenuItems as menuItem[]).forEach((item: menuItem) => {
      const hasActiveSub = item.subCategories?.some((subItem: SubCategory) => (subItem.link ? isActiveRoute(router, subItem.link) : false));
      if (hasActiveSub) {
        nextExpanded.add(item.id);
        return;
      }
      if ((item.subCategories?.length ?? 0) > 0) {
        const isOnRelatedPage = item.subCategories!.some((subItem: SubCategory) => (subItem.link ? isActiveRoute(router, subItem.link) : false));
        if (isOnRelatedPage) nextExpanded.add(item.id);
      }
    });

    setExpandedItems(prev => {
      if (prev.size === nextExpanded.size) {
        let same = true;
        for (const id of Array.from(prev)) { if (!nextExpanded.has(id)) { same = false; break; } }
        if (same) return prev; // no change → avoid rerender loop
      }
      return nextExpanded;
    });
  }, [router.asPath, MenuItems]);

  const handleInsightSubItemClick = (id: number) => {
    const basePath = '/insights';
    const path = `${basePath}/${id}`;
    router.push(path);
  };

  const handlePopperClose = () => {
    setPopperItem(undefined);
  };

  useEffect(() => {
    if (!isSidebarCollapsed || !sidebarRef.current) return;

    let hoverTimeout: NodeJS.Timeout;
    let isOverPopover = false;

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const itemContainer = target.closest('[data-sidebar-item]') as HTMLElement;

      if (!itemContainer) return;

      const itemId = itemContainer.getAttribute('data-item-id');
      const item = (MenuItems as menuItem[]).find(menuItem => menuItem.id.toString() === itemId);

      if (item && item.subCategories && item.subCategories.length > 0) {
        clearTimeout(hoverTimeout);
        setPopperItem({ ...(item as SidebarItemType), anchorEl: itemContainer });
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const relatedTarget = e.relatedTarget as HTMLElement;

      if (
        relatedTarget &&
        (relatedTarget.closest('[role="presentation"]') || relatedTarget.closest('.MuiPopover-paper'))
      ) {
        isOverPopover = true;
        return;
      }

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
        hasNestedSubItems={MenuItems.filter(item => Object.prototype.hasOwnProperty.call(item, 'subCategories')).length > 0}
      >
        <ScrollableContent>
          <SidebarSection
            menuItems={(MenuItems as menuItem[]).filter(el => el.id < 90 && el.position !== 'bottom')}
            {...sidebarSectionProps}
          />
          <SidebarSection
            menuItems={(MenuItems as menuItem[]).filter(el => el.id > 90 && el.position !== 'bottom')}
            {...sidebarSectionProps}
          />
          <SidebarSection
            menuItems={(MenuItems as menuItem[]).filter(el => el.position === 'bottom')}
            {...sidebarSectionProps}
            classNames={isLowHeight ? styles.bottomSectionRelative : styles.bottomSection}
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
          onMouseEnter: () => {},
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
                  } else if (item.link) {
                    handleItemClick({ id: item.id, link: item.link });
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
                <Typography fontFamily="Roboto" variant="body-regular">{item.label}</Typography>
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
