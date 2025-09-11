import { Tooltip } from 'shyftlabs-dsl';
import { menuItem, SubCategories } from '../types/typings';
import SidebarItem from './sidebar-item.component';

interface SidebarSectionProps {
  menuItems: menuItem[];
  getActiveSubItemIndex: (subCategories: Array<{ link?: string }> | undefined) => number;
  expandedItems: Set<number>;
  isSidebarCollapsed: boolean;
  isActive: (link: string) => boolean;
  toggleSubItems: (id: number) => void;
  handleItemClick: (item: menuItem | { id: number; link: string }) => void;
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
    const aIsBottom = a.position === 'bottom';
    const bIsBottom = b.position === 'bottom';
    if (aIsBottom && !bIsBottom) return 1;
    if (!aIsBottom && bIsBottom) return -1;
    return 0;
  });

  return (
    <div className={classNames}>
      {sortedMenuItems.map((item, index) => {
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
                  item={{
                    id: item.id,
                    label: item.label,
                    icon: item.icon,
                    link: item.link ?? '',
                    subCategories: (item.subCategories ?? []).map((s) => ({
                      id: s.id,
                      label: s.label,
                      icon: undefined,
                      link: s.link ?? '',
                      show: s.show ?? true,
                    })),
                    show: item.show ?? true,
                  }}
                  sidebarCollapsed={isSidebarCollapsed}
                  showSubItems={isItemExpanded}
                  isActive={Boolean(isActive(item.link ?? '')) || activeSubItemIndex !== -1}
                  onToggleSubItems={() => toggleSubItems(item.id)}
                  onItemClick={() => handleItemClick(item)}
                  testId={item?.testId}
                />
              </div>
            </Tooltip>
            {!isSidebarCollapsed &&
              isItemExpanded &&
              item.subCategories &&
              item.subCategories.map((subItem: SubCategories, index: number) => {
                if (subItem.show === false) return null;
                if (item.link === '/insights')
                  return (
                    <SidebarItem
                      key={subItem.id}
                      item={{
                        id: subItem.id,
                        label: subItem.label,
                        icon: undefined,
                        link: String(subItem.id),
                        show: subItem.show ?? true,
                      }}
                      isActive={isInsightActive(String(subItem.id))}
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
                    item={{
                      id: subItem.id,
                      label: subItem.label,
                      icon: undefined,
                      link: subItem.link ?? '',
                      show: subItem.show ?? true,
                    }}
                    isActive={Boolean(isActive(subItem.link ?? ''))}
                    isSubItem={true}
                    sidebarCollapsed={isSidebarCollapsed}
                    onItemClick={() => handleItemClick({ id: subItem.id, link: subItem.link ?? '' })}
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
