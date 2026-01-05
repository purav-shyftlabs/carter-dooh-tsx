import React, { useState, useCallback } from 'react';
import SidebarContentDeck from '../components/sidebar-content-deck.component';
import LayoutCanvas, { type LayoutItem } from '../components/layout-canvas.component';
import type { File as LibraryFile } from '@/types/folder';
import type { PlaylistListItem } from '@/services/content/playlist.service';
import type { Integration } from '@/types/integrations';
import styles from './layout-form.module.scss';

const LayoutForm = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [canvasItems, setCanvasItems] = useState<LayoutItem[]>([]);

  const generateId = () => `item-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

  const handleMediaSelect = useCallback((file: LibraryFile) => {
    const isVideo = file.content_type?.startsWith('video/');
    const newItem: LayoutItem = {
      id: generateId(),
      type: isVideo ? 'video' : 'image',
      file,
      name: file.original_filename || file.name || 'Media',
      x: Math.floor(Math.random() * 10),
      y: Math.floor(Math.random() * 10),
      w: 4,
      h: 4,
    };
    setCanvasItems((prev) => [...prev, newItem]);
  }, []);

  const handlePlaylistSelect = useCallback((playlist: PlaylistListItem) => {
    const newItem: LayoutItem = {
      id: generateId(),
      type: 'playlist',
      playlist,
      name: playlist.name,
      x: Math.floor(Math.random() * 10),
      y: Math.floor(Math.random() * 10),
      w: 6,
      h: 6,
    };
    setCanvasItems((prev) => [...prev, newItem]);
  }, []);

  const handleIntegrationSelect = useCallback((integration: Integration) => {
    const integrationName = integration.app?.name || 'Integration';
    const cityConfig = integration.configurations?.find((c) => c.key === 'city');
    const cityName = cityConfig ? ` - ${cityConfig.value}` : '';
    const name = `${integrationName}${cityName}`;
    
    const newItem: LayoutItem = {
      id: generateId(),
      type: 'integration',
      integration,
      name,
      x: Math.floor(Math.random() * 10),
      y: Math.floor(Math.random() * 10),
      w: 5,
      h: 5,
    };
    setCanvasItems((prev) => [...prev, newItem]);
  }, []);

  const handleSidebarToggle = (isOpen: boolean) => {
    setSidebarOpen(isOpen);
  };

  const handleItemsChange = useCallback((items: LayoutItem[]) => {
    setCanvasItems(items);
  }, []);

  const handleItemRemove = useCallback((itemId: string) => {
    setCanvasItems((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  return (
    <div className={styles.layoutFormContainer}>
      <div className={styles.sidebarSection}>
        <SidebarContentDeck
          onMediaSelect={handleMediaSelect}
          onPlaylistSelect={handlePlaylistSelect}
          onIntegrationSelect={handleIntegrationSelect}
          onSidebarToggle={handleSidebarToggle}
        />
      </div>
      <div className={`${styles.contentSection} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.canvasContainer}>
          <LayoutCanvas
            items={canvasItems}
            onItemsChange={handleItemsChange}
            onItemRemove={handleItemRemove}
          />
        </div>
      </div>
    </div>
  );
};

export default LayoutForm;
