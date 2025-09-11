import { Tooltip } from 'shyftlabs-dsl';
import { menuItem } from '../types/typings';
import SidebarItem from './sidebar-item.component';

interface SidebarSectionProps {
  menuItems: menuItem[];
  getActiveSubItemIndex: (subCategories: any[] | undefined) => number;
  expandedItems: Set<number>;
  isSidebarCollapsed: boolean;
  isActive: (link: string) => boolean;
  toggleSubItems: (id: number) => void;
  handleItemClick: (item: any) => void;
  isInsightActive: (id: string) => boolean;
  handleInsightSubItemClick: (id: number) => void;
  classNames?: string;
}

const SidebarSection = ({
  menuItems,
  getActiveSubItemIndex,
  expandedItems,
  isSidebarCollapsed,
  isActive,
  toggleSubItems,
  handleItemClick,
  isInsightActive,
  handleInsightSubItemClick,
  classNames,
}: SidebarSectionProps) => {
  // Sort menu items: top items first, then bottom items
  const sortedMenuItems = [...menuItems].sort((a, b) => {
    if (a.position === 'bottom' && b.position !== 'bottom') return 1;
    if (a.position !== 'bottom' && b.position === 'bottom') return -1;
    return 0;
  });

  return (
    <div className={classNames}>
      {sortedMenuItems.map((item: any, index) => {
        const activeSubItemIndex = getActiveSubItemIndex(item.subCategories);
        const isItemExpanded = expandedItems.has(item.id);
        if (item.show === false) return null;

        // Add margin-top for bottom-positioned items to create visual separation
        const isBottomItem = item.position === 'bottom';
        const isFirstBottomItem =
          isBottomItem && sortedMenuItems.slice(0, index).every(prevItem => prevItem.position !== 'bottom');

        return (
          <div
            key={item.id}
            style={{
              padding: '4px 15px',
              marginTop: isFirstBottomItem ? '32px' : '0px',
            }}
            data-sidebar-item
            data-item-id={item.id}
          >
            <Tooltip
              title={isSidebarCollapsed ? item.label : undefined}
              PopperProps={{
                popperOptions: {
                  placement: 'right',
                },
              }}
            >
              <div>
                <SidebarItem
                  item={item}
                  sidebarCollapsed={isSidebarCollapsed}
                  showSubItems={isItemExpanded}
                  isActive={isActive(item.link) || activeSubItemIndex !== -1}
                  onToggleSubItems={() => toggleSubItems(item.id)}
                  onItemClick={() => handleItemClick(item)}
                  testId={item?.testId}
                />
              </div>
            </Tooltip>
            {!isSidebarCollapsed &&
              isItemExpanded &&
              item.subCategories &&
              item.subCategories.map((subItem: any, index: number) => {
                if (subItem.show === false) return null;
                if (item.link === '/insights')
                  return (
                    <SidebarItem
                      key={subItem.id}
                      item={subItem}
                      isActive={isInsightActive(subItem.id)}
                      isSubItem={true}
                      sidebarCollapsed={isSidebarCollapsed}
                      onItemClick={() => handleInsightSubItemClick(subItem.id)}
                      activeSubItemIndex={activeSubItemIndex}
                      index={index}
                      testId={subItem?.testId}
                    />
                  );
                return (
                  <SidebarItem
                    key={subItem.id}
                    item={subItem}
                    isActive={isActive(subItem.link)}
                    isSubItem={true}
                    sidebarCollapsed={isSidebarCollapsed}
                    onItemClick={() => handleItemClick(subItem)}
                    activeSubItemIndex={activeSubItemIndex}
                    index={index}
                    testId={subItem.testId}
                  />
                );
              })}
          </div>
        );
      })}
    </div>
  );
};

export default SidebarSection;
