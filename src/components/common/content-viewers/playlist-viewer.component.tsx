import { useEffect, useState, useRef } from 'react';
import { playlistRenderService, type PlaylistContent } from '@/services/content/playlist.service';
import ImageViewer from './image-viewer.component';
import VideoPlayer from './video-player.component';
import WebsiteViewer from './website-viewer.component';
import IntegrationViewer from './integration-viewer.component';
import styles from './content-viewers.module.scss';

export type PlaylistViewerProps = {
  playlistId: number;
  autoPlay?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
};

const PlaylistViewer: React.FC<PlaylistViewerProps> = ({
  playlistId,
  autoPlay = true,
  className,
  style,
  onLoad,
  onError,
}) => {
  const [playlistItems, setPlaylistItems] = useState<PlaylistContent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadPlaylist = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        const playlist = await playlistRenderService.getPlaylistById(playlistId);
        
        if (playlist.contents && playlist.contents.length > 0) {
          const sortedContents = playlist.contents.sort((a, b) => a.order_index - b.order_index);
          setPlaylistItems(sortedContents);
          if (onLoad) onLoad();
        } else {
          setPlaylistItems([]);
        }
      } catch (error) {
        console.error('Error loading playlist:', error);
        setHasError(true);
        if (onError) onError();
      } finally {
        setIsLoading(false);
      }
    };

    if (playlistId) {
      loadPlaylist();
    }
  }, [playlistId, onLoad, onError]);

  // Auto-advance to next item
  useEffect(() => {
    if (playlistItems.length > 0 && autoPlay) {
      const currentItem = playlistItems[currentIndex];
      if (currentItem) {
        const duration = (currentItem.duration_seconds || 10) * 1000;
        
        timerRef.current = setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % playlistItems.length);
        }, duration);
      }
      
      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }
  }, [playlistItems, currentIndex, autoPlay]);

  if (isLoading) {
    return (
      <div className={`${styles.loadingContainer} ${className || ''}`} style={style}>
        <div className={styles.loadingSpinner}>Loading playlist...</div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={`${styles.errorContainer} ${className || ''}`} style={style}>
        <div>Failed to load playlist</div>
      </div>
    );
  }

  if (playlistItems.length === 0) {
    return (
      <div className={`${styles.errorContainer} ${className || ''}`} style={style}>
        <div>Playlist is empty</div>
      </div>
    );
  }

  const currentItem = playlistItems[currentIndex];

  if (!currentItem) {
    return null;
  }

  return (
    <div className={`${styles.playlistContainer} ${className || ''}`} style={style}>
      {currentItem.type === 'image' && currentItem.image_url && (
        <ImageViewer
          url={currentItem.image_url}
          alt={currentItem.name}
          style={{ width: '100%', height: '100%' }}
        />
      )}
      {currentItem.type === 'video' && currentItem.video_url && (
        <VideoPlayer
          url={currentItem.video_url}
          autoPlay={autoPlay}
          loop={false}
          muted
          controls={false}
          style={{ width: '100%', height: '100%' }}
        />
      )}
      {currentItem.type === 'website' && currentItem.website_url && (
        <WebsiteViewer
          url={currentItem.website_url}
          title={currentItem.name}
          style={{ width: '100%', height: '100%' }}
        />
      )}
      {currentItem.type === 'integration' && currentItem.integration_id && (
        <IntegrationViewer
          integrationId={currentItem.integration_id}
          integrationName={currentItem.name}
          appName={currentItem.integration?.app_name}
          style={{ width: '100%', height: '100%' }}
        />
      )}
      {/* {playlistItems.length > 1 && (
        <div className={styles.playlistIndicator}>
          {currentIndex + 1} / {playlistItems.length}
        </div>
      )} */}
    </div>
  );
};

export default PlaylistViewer;

