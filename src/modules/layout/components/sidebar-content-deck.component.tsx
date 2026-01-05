import React, { useState, useEffect } from 'react';
import { Image, Video, ListMusic, Plug2, X } from 'lucide-react';
import { MediaLibrary } from '@/components/common/media-library';
import { IntegrationSelector } from '@/components/common/integration-selector';
import { playlistRenderService, type PlaylistListItem } from '@/services/content/playlist.service';
import type { File as LibraryFile } from '@/types/folder';
import type { Integration } from '@/types/integrations';
import styles from './sidebar-content-deck.module.scss';

export type SidebarContentDeckProps = {
  onMediaSelect?: (file: LibraryFile) => void;
  onPlaylistSelect?: (playlist: PlaylistListItem) => void;
  onIntegrationSelect?: (integration: Integration) => void;
  onSidebarToggle?: (isOpen: boolean) => void;
};

type TabType = 'media' | 'playlist' | 'apps' | null;

const SidebarContentDeck: React.FC<SidebarContentDeckProps> = ({
  onMediaSelect,
  onPlaylistSelect,
  onIntegrationSelect,
  onSidebarToggle,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [playlists, setPlaylists] = useState<PlaylistListItem[]>([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);

  // Fetch playlists when playlist tab is opened
  useEffect(() => {
    if (activeTab === 'playlist' && playlists.length === 0) {
      const loadPlaylists = async () => {
        try {
          setIsLoadingPlaylists(true);
          const response = await playlistRenderService.getPlaylists({
            status: 'active',
            limit: 100,
            skip: 0,
            sort: 'name ASC',
          });
          setPlaylists(response.data || []);
        } catch (error) {
          console.error('Error loading playlists:', error);
          setPlaylists([]);
        } finally {
          setIsLoadingPlaylists(false);
        }
      };
      loadPlaylists();
    }
  }, [activeTab, playlists.length]);

  const handleTabClick = (tab: TabType) => {
    if (activeTab === tab && isOpen) {
      // Close if clicking the same tab
      setIsOpen(false);
      setActiveTab(null);
      if (onSidebarToggle) onSidebarToggle(false);
    } else {
      // Open sidebar with selected tab
      setActiveTab(tab);
      setIsOpen(true);
      if (onSidebarToggle) onSidebarToggle(true);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setActiveTab(null);
    if (onSidebarToggle) onSidebarToggle(false);
  };

  const handleMediaSelect = (file: LibraryFile) => {
    if (onMediaSelect) {
      onMediaSelect(file);
    }
  };

  const handlePlaylistSelect = (playlist: PlaylistListItem) => {
    if (onPlaylistSelect) {
      onPlaylistSelect(playlist);
    }
  };

  return (
    <div className={styles.sidebarContentDeck}>
      {/* Icon Deck */}
      <div className={styles.iconDeck}>
        <button
          className={`${styles.deckButton} ${activeTab === 'media' && isOpen ? styles.active : ''}`}
          onClick={() => handleTabClick('media')}
          title="Media Library"
        >
          <Image size={20} />
          <span className={styles.buttonLabel}>Media</span>
        </button>
        <button
          className={`${styles.deckButton} ${activeTab === 'playlist' && isOpen ? styles.active : ''}`}
          onClick={() => handleTabClick('playlist')}
          title="Playlists"
        >
          <ListMusic size={20} />
          <span className={styles.buttonLabel}>Playlist</span>
        </button>
        <button
          className={`${styles.deckButton} ${activeTab === 'apps' && isOpen ? styles.active : ''}`}
          onClick={() => handleTabClick('apps')}
          title="Apps & Integrations"
        >
          <Plug2 size={20} />
          <span className={styles.buttonLabel}>Apps</span>
        </button>
      </div>

      {/* Sidebar */}
      <div className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.sidebarHeader}>
          <h3 className={styles.sidebarTitle}>
            {activeTab === 'media' && 'Media Library'}
            {activeTab === 'playlist' && 'Playlists'}
            {activeTab === 'apps' && 'Apps & Integrations'}
          </h3>
          <button className={styles.closeButton} onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.sidebarContent}>
          {activeTab === 'media' && (
            <MediaLibrary
              title=""
              onItemSelect={handleMediaSelect}
              showWebsiteForm={false}
              showIntegrationSelector={false}
            />
          )}

          {activeTab === 'playlist' && (
            <div className={styles.playlistList}>
              {isLoadingPlaylists ? (
                <div className={styles.loadingState}>Loading playlists...</div>
              ) : playlists.length === 0 ? (
                <div className={styles.emptyState}>No playlists found</div>
              ) : (
                <div className={styles.playlistGrid}>
                  {playlists.map((playlist) => (
                    <div
                      key={playlist.id}
                      className={styles.playlistCard}
                      onClick={() => handlePlaylistSelect(playlist)}
                    >
                      {playlist.thumbnail_url ? (
                        <img
                          src={playlist.thumbnail_url}
                          alt={playlist.name}
                          className={styles.playlistThumbnail}
                        />
                      ) : (
                        <div className={styles.playlistPlaceholder}>
                          <ListMusic size={32} />
                        </div>
                      )}
                      <div className={styles.playlistInfo}>
                        <div className={styles.playlistName}>{playlist.name}</div>
                        {playlist.description && (
                          <div className={styles.playlistDescription}>{playlist.description}</div>
                        )}
                        {playlist.contents && (
                          <div className={styles.playlistMeta}>
                            {playlist.contents.length} item{playlist.contents.length !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'apps' && (
            <div className={styles.appsContent}>
              {onIntegrationSelect ? (
                <IntegrationSelector onIntegrationSelect={onIntegrationSelect} />
              ) : (
                <div className={styles.emptyState}>Integration selector not configured</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Backdrop - Optional, can be enabled if needed */}
      {/* {isOpen && <div className={styles.backdrop} onClick={handleClose} />} */}
    </div>
  );
};

export default SidebarContentDeck;
