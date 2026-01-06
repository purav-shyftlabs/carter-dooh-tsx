import React, { useState, useEffect } from 'react';
import { Button } from 'shyftlabs-dsl';
import { ArrowLeft, Monitor, Image as ImageIcon, Check, ListMusic } from 'lucide-react';
import { useRouter } from 'next/router';
import styles from '../styles/push-content.module.scss';
import { screensService } from '@/services/screens/screens.service';
import { contentService } from '@/services/content/content.service';
import { playlistRenderService } from '@/services/content/playlist.service';
import type { Screen } from '@/types/screens';
import type { File } from '@/types/folder';
import type { PlaylistListItem } from '@/services/content/playlist.service';
import PageHeader from '@/components/page-header/page-header.component';
import ROUTES from '@/common/routes';
import useAlert from '@/contexts/alert/alert.hook';
import { AlertVariant } from '@/contexts/alert/alert.provider';

const PushContent: React.FC = () => {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [screens, setScreens] = useState<Screen[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistListItem[]>([]);
  const [selectedScreen, setSelectedScreen] = useState<Screen | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistListItem | null>(null);
  const [isLoadingScreens, setIsLoadingScreens] = useState(false);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [imageUrls, setImageUrls] = useState<Record<string | number, string>>({});

  // Load screens
  useEffect(() => {
    const loadScreens = async () => {
      try {
        setIsLoadingScreens(true);
        const result = await screensService.listScreens();
        setScreens(result);
      } catch (error) {
        console.error('Error loading screens:', error);
        showAlert('Failed to load screens', AlertVariant.ERROR);
      } finally {
        setIsLoadingScreens(false);
      }
    };

    loadScreens();
  }, [showAlert]);

  // Load images
  useEffect(() => {
    const loadImages = async () => {
      try {
        setIsLoadingImages(true);
        const response = await contentService.getFiles(undefined, 'image');
        const files = response.data || [];
        setImages(files);

        // Load image URLs
        const urlPromises = files.map(async (file: File) => {
          try {
            const url = await contentService.getFileUrl(file);
            return { id: file.id, url };
          } catch (error) {
            console.error(`Failed to load URL for file ${file.id}:`, error);
            return { id: file.id, url: file.fileUrl || '' };
          }
        });

        const urlResults = await Promise.all(urlPromises);
        const urlMap: Record<string | number, string> = {};
        urlResults.forEach(({ id, url }) => {
          urlMap[id] = url;
        });
        setImageUrls(urlMap);
      } catch (error) {
        console.error('Error loading images:', error);
        showAlert('Failed to load images', AlertVariant.ERROR);
      } finally {
        setIsLoadingImages(false);
      }
    };

    loadImages();
  }, [showAlert]);

  // Load playlists
  useEffect(() => {
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
        showAlert('Failed to load playlists', AlertVariant.ERROR);
      } finally {
        setIsLoadingPlaylists(false);
      }
    };

    loadPlaylists();
  }, [showAlert]);

  const handlePush = async () => {
    if (!selectedScreen) {
      showAlert('Please select a screen', AlertVariant.ERROR);
      return;
    }

    if (!selectedImage && !selectedPlaylist) {
      showAlert('Please select either an image or a playlist', AlertVariant.ERROR);
      return;
    }

    try {
      setIsPushing(true);
      const fileId = selectedImage
        ? typeof selectedImage.id === 'number'
          ? selectedImage.id
          : parseInt(String(selectedImage.id), 10)
        : undefined;
      const playlistId = selectedPlaylist
        ? typeof selectedPlaylist.id === 'number'
          ? selectedPlaylist.id
          : parseInt(String(selectedPlaylist.id), 10)
        : undefined;
      await screensService.pushContentToScreen(selectedScreen.id, fileId, playlistId);
      showAlert('Content pushed to screen successfully!', AlertVariant.SUCCESS);
      // Redirect to screen detail page
      setTimeout(() => {
        router.push(`${ROUTES.BILLBOARD.LIST}/${selectedScreen.id}`);
      }, 1000);
    } catch (error) {
      console.error('Error pushing content:', error);
      const errorMessage =
        error && typeof error === 'object' && 'response' in error
          ? ((error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
              'Failed to push content to screen')
          : 'Failed to push content to screen';
      showAlert(errorMessage, AlertVariant.ERROR);
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <div className={styles.pushContentContainer}>
      <PageHeader
        title="Push Content"
        ActionComponent={() => (
          <Button
            label="Back"
            icon={<ArrowLeft />}
            onClick={() => router.push(ROUTES.BILLBOARD.LIST)}
            variant="tertiary"
            size="small"
            iconPosition="left"
          />
        )}
      />

      <div className={styles.content}>
        <div className={styles.selectionSection}>
          <div className={styles.screensSection}>
            <h2 className={styles.sectionTitle}>
              <Monitor size={20} />
              Select Screen
            </h2>
            {isLoadingScreens ? (
              <div className={styles.loading}>Loading screens...</div>
            ) : screens.length === 0 ? (
              <div className={styles.empty}>No screens available</div>
            ) : (
              <div className={styles.screensGrid}>
                {screens.map((screen) => (
                  <div
                    key={screen.id}
                    className={`${styles.screenCard} ${selectedScreen?.id === screen.id ? styles.selected : ''}`}
                    onClick={() => setSelectedScreen(screen)}
                  >
                    <div className={styles.screenIcon}>
                      <Monitor size={24} />
                    </div>
                    <div className={styles.screenInfo}>
                      <h3>{screen.name}</h3>
                      <p>{screen.deviceName || screen.name}</p>
                      <span className={`${styles.status} ${screen.isOnline ? styles.online : styles.offline}`}>
                        {screen.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    {selectedScreen?.id === screen.id && (
                      <div className={styles.checkmark}>
                        <Check size={20} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.imagesSection}>
            <h2 className={styles.sectionTitle}>
              <ImageIcon size={20} />
              Select Image
            </h2>
            {isLoadingImages ? (
              <div className={styles.loading}>Loading images...</div>
            ) : images.length === 0 ? (
              <div className={styles.empty}>No images available</div>
            ) : (
              <div className={styles.imagesGrid}>
                {images.map((image) => (
                  <div
                    key={image.id}
                    className={`${styles.imageCard} ${selectedImage?.id === image.id ? styles.selected : ''}`}
                    onClick={() => {
                      setSelectedImage(image);
                      setSelectedPlaylist(null);
                    }}
                  >
                    <div className={styles.imagePreview}>
                      {imageUrls[image.id] ? (
                        <img src={imageUrls[image.id]} alt={image.original_filename} />
                      ) : (
                        <div className={styles.imagePlaceholder}>
                          <ImageIcon size={32} />
                        </div>
                      )}
                    </div>
                    <div className={styles.imageInfo}>
                      <p className={styles.imageName}>{image.original_filename}</p>
                    </div>
                    {selectedImage?.id === image.id && (
                      <div className={styles.checkmark}>
                        <Check size={20} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.playlistsSection}>
            <h2 className={styles.sectionTitle}>
              <ListMusic size={20} />
              Select Playlist
            </h2>
            {isLoadingPlaylists ? (
              <div className={styles.loading}>Loading playlists...</div>
            ) : playlists.length === 0 ? (
              <div className={styles.empty}>No playlists available</div>
            ) : (
              <div className={styles.playlistsGrid}>
                {playlists.map((playlist) => (
                  <div
                    key={playlist.id}
                    className={`${styles.playlistCard} ${selectedPlaylist?.id === playlist.id ? styles.selected : ''}`}
                    onClick={() => {
                      setSelectedPlaylist(playlist);
                      setSelectedImage(null);
                    }}
                  >
                    <div className={styles.playlistIcon}>
                      <ListMusic size={24} />
                    </div>
                    <div className={styles.playlistInfo}>
                      <h3>{playlist.name}</h3>
                      <p>{playlist.description || 'No description'}</p>
                      <span className={styles.playlistMeta}>
                        {playlist.total_items} items • {Math.floor(playlist.duration_seconds / 60)}m{' '}
                        {playlist.duration_seconds % 60}s
                      </span>
                    </div>
                    {selectedPlaylist?.id === playlist.id && (
                      <div className={styles.checkmark}>
                        <Check size={20} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.actionsSection}>
          <div className={styles.selectionSummary}>
            {selectedScreen && (
              <div className={styles.summaryItem}>
                <strong>Screen:</strong> {selectedScreen.name}
              </div>
            )}
            {selectedImage && (
              <div className={styles.summaryItem}>
                <strong>Image:</strong> {selectedImage.original_filename}
              </div>
            )}
            {selectedPlaylist && (
              <div className={styles.summaryItem}>
                <strong>Playlist:</strong> {selectedPlaylist.name}
              </div>
            )}
          </div>
          <Button
            label={isPushing ? 'Pushing...' : 'Push to Screen'}
            onClick={handlePush}
            variant="primary"
            size="medium"
            disabled={!selectedScreen || (!selectedImage && !selectedPlaylist) || isPushing}
          />
        </div>
      </div>
    </div>
  );
};

export default PushContent;

