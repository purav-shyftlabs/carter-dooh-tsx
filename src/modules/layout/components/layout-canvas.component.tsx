import React, { useState, useCallback, useMemo } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import type { File as LibraryFile } from '@/types/folder';
import type { PlaylistListItem } from '@/services/content/playlist.service';
import type { Integration } from '@/types/integrations';
import { ContentRenderer } from '@/components/common/content-viewers';
import { X } from 'lucide-react';
import styles from './layout-canvas.module.scss';

const ResponsiveGridLayout = WidthProvider(Responsive);

export type LayoutItem = {
  id: string;
  type: 'image' | 'video' | 'website' | 'integration' | 'playlist';
  file?: LibraryFile;
  playlist?: PlaylistListItem;
  integration?: Integration;
  url?: string;
  name: string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
};

export type LayoutCanvasProps = {
  items?: LayoutItem[];
  onItemsChange?: (items: LayoutItem[]) => void;
  onItemRemove?: (itemId: string) => void;
};

const LayoutCanvas: React.FC<LayoutCanvasProps> = ({
  items = [],
  onItemsChange,
  onItemRemove,
}) => {
  const [layoutItems, setLayoutItems] = useState<LayoutItem[]>(items);

  // Convert layout items to react-grid-layout format
  const gridLayout = useMemo<Layout[]>(() => {
    return layoutItems.map((item) => ({
      i: item.id,
      x: item.x ?? 0,
      y: item.y ?? 0,
      w: item.w ?? 4,
      h: item.h ?? 4,
      minW: 2,
      minH: 2,
      maxW: 12,
      maxH: 12,
    }));
  }, [layoutItems]);

  // Update items when props change
  React.useEffect(() => {
    setLayoutItems(items);
  }, [items]);

  // Handle layout change (drag/resize)
  const handleLayoutChange = useCallback((layout: Layout[]) => {
    const updatedItems = layoutItems.map((item) => {
      const layoutItem = layout.find((l) => l.i === item.id);
      if (layoutItem) {
        return {
          ...item,
          x: layoutItem.x,
          y: layoutItem.y,
          w: layoutItem.w,
          h: layoutItem.h,
        };
      }
      return item;
    });
    setLayoutItems(updatedItems);
    if (onItemsChange) {
      onItemsChange(updatedItems);
    }
  }, [layoutItems, onItemsChange]);

  const handleRemoveItem = useCallback((itemId: string) => {
    const updatedItems = layoutItems.filter((item) => item.id !== itemId);
    setLayoutItems(updatedItems);
    if (onItemsChange) {
      onItemsChange(updatedItems);
    }
    if (onItemRemove) {
      onItemRemove(itemId);
    }
  }, [layoutItems, onItemsChange, onItemRemove]);

  const renderItemContent = (item: LayoutItem) => {
    switch (item.type) {
      case 'image':
        return (
          <ContentRenderer
            type="image"
            file={item.file}
            url={item.url}
            style={{ width: '100%', height: '100%' }}
          />
        );
      case 'video':
        return (
          <ContentRenderer
            type="video"
            file={item.file}
            url={item.url}
            autoPlay
            loop
            muted
            controls={false}
            style={{ width: '100%', height: '100%' }}
          />
        );
      case 'website':
        return (
          <ContentRenderer
            type="website"
            url={item.url || ''}
            style={{ width: '100%', height: '100%' }}
          />
        );
      case 'integration':
        return (
          <ContentRenderer
            type="integration"
            integrationId={item.integration?.id || 0}
            appName={item.integration?.app?.name}
            integrationName={item.name}
            style={{ width: '100%', height: '100%' }}
          />
        );
      case 'playlist':
        return (
          <ContentRenderer
            type="playlist"
            playlistId={item.playlist?.id || 0}
            autoPlay
            style={{ width: '100%', height: '100%' }}
          />
        );
      default:
        return <div>Unknown type</div>;
    }
  };

  return (
    <div className={styles.layoutCanvas}>
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: gridLayout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={30}
        margin={[8, 8]}
        isDraggable={true}
        isResizable={true}
        compactType={null} // Allow items to float freely
        preventCollision={false} // No restrictions on placement
        onLayoutChange={handleLayoutChange}
        draggableHandle=".grid-item-drag-handle"
        allowOverlap={true} // Allow items to overlap
        containerPadding={[0, 0]} // No padding
      >
        {layoutItems.map((item) => (
          <div key={item.id} className={styles.gridItem}>
            <div className={styles.itemHeader}>
              <span className={styles.itemName}>{item.name}</span>
              <button
                className={styles.removeButton}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleRemoveItem(item.id);
                }}
                title="Remove"
                type="button"
              >
                <X size={16} />
              </button>
            </div>
            <div className="grid-item-drag-handle">
              <div className={styles.itemContent}>
                {renderItemContent(item)}
              </div>
            </div>
          </div>
        ))}
      </ResponsiveGridLayout>
      {layoutItems.length === 0 && (
        <div className={styles.emptyCanvas}>
          <div className={styles.emptyMessage}>
            <h3>Empty Canvas</h3>
            <p>Drag items from the sidebar or click to add them to the canvas</p>
            <p className={styles.emptyHint}>Items can be placed anywhere and resized freely</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LayoutCanvas;
