import { useEffect, useState, useRef } from 'react';
import { contentService } from '@/services/content/content.service';
import type { File as LibraryFile } from '@/types/folder';
import ReactPlayer from 'react-player';
import styles from './content-viewers.module.scss';

// Enable ReactPlayer for all video formats
if (typeof window !== 'undefined') {
  // Ensure ReactPlayer is configured for all video types
  (ReactPlayer as any).canPlay = (url: string) => {
    return ReactPlayer.canPlay(url);
  };
}

export type VideoPlayerProps = {
  file?: LibraryFile;
  url?: string;
  poster?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
  onEnded?: () => void;
};

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  file,
  url,
  poster,
  autoPlay = false,
  loop = false,
  muted = true,
  controls = false,
  className,
  style,
  onLoad,
  onError,
  onEnded,
}) => {
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [posterUrl, setPosterUrl] = useState<string>(poster || '');
  const playerRef = useRef<ReactPlayer>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadVideo = async () => {
      if (url) {
        setVideoUrl(url);
        setIsLoading(false);
        return;
      }

      if (file) {
        try {
          setIsLoading(true);
          setHasError(false);
          
          // Use fileUrl directly from the file object (GCP URL)
          if (file.fileUrl) {
            console.log('Using file URL directly:', file.fileUrl);
            setVideoUrl(file.fileUrl);
            setIsLoading(false);
            return;
          }
          
          // Fallback: try to get signed URL if fileUrl is not available
          console.log('fileUrl not available, fetching signed URL...');
          const signedUrl = await contentService.getFileUrl(file);
          console.log('Got signed URL:', signedUrl);
          if (signedUrl) {
            setVideoUrl(signedUrl);
            setIsLoading(false);
          } else {
            throw new Error('No URL returned');
          }
        } catch (error) {
          console.error('Failed to load video URL:', error);
          setHasError(true);
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    loadVideo();
  }, [file, url]);

  // Generate poster from first frame if not provided
  useEffect(() => {
    if (!poster && videoUrl && !posterUrl) {
      const generatePoster = async () => {
        try {
          const video = document.createElement('video');
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) return;
          
          video.crossOrigin = 'anonymous';
          video.preload = 'metadata';
          
          video.onloadedmetadata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            video.currentTime = 0.1;
          };
          
          video.onseeked = () => {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
            setPosterUrl(thumbnailUrl);
            video.remove();
          };
          
          video.onerror = () => {
            video.remove();
          };
          
          video.src = videoUrl;
        } catch (error) {
          console.warn('Failed to generate video poster:', error);
        }
      };
      
      generatePoster();
    }
  }, [videoUrl, poster, posterUrl]);

  // Handle container resize to maintain video aspect ratio
  useEffect(() => {
    if (!containerRef.current || !playerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      // Force ReactPlayer to recalculate size on container resize
      if (playerRef.current) {
        const player = playerRef.current as any;
        if (player.getInternalPlayer) {
          const internalPlayer = player.getInternalPlayer();
          if (internalPlayer && typeof internalPlayer.handleResize === 'function') {
            internalPlayer.handleResize();
          }
        }
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [videoUrl]);

  if (isLoading && !videoUrl) {
    return (
      <div className={`${styles.loadingContainer} ${className || ''}`} style={style}>
        <div className={styles.loadingSpinner}>Loading video...</div>
      </div>
    );
  }

  if (hasError && !videoUrl) {
    return (
      <div className={`${styles.errorContainer} ${className || ''}`} style={style}>
        <div>Failed to load video</div>
      </div>
    );
  }

  if (!videoUrl) {
    return (
      <div className={`${styles.errorContainer} ${className || ''}`} style={style}>
        <div>No video URL available</div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      style={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        overflow: 'hidden',
        maxWidth: '100%',
        maxHeight: '100%',
        position: 'relative',
        minHeight: 0,
        minWidth: 0,
        ...style 
      }}
    >
      <div style={{
        width: '100%',
        height: '100%',
        maxWidth: '100%',
        maxHeight: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
        minHeight: 0,
        minWidth: 0
      }}>
        <ReactPlayer
          ref={playerRef}
          url={videoUrl}
          playing={autoPlay}
          loop={loop}
          muted={muted}
          controls={controls}
          width="100%"
          height="100%"
          className={className}
          poster={posterUrl || undefined}
          onReady={() => {
            setIsLoading(false);
            if (onLoad) onLoad();
          }}
          onError={() => {
            setHasError(true);
            setIsLoading(false);
            if (onError) onError();
          }}
          onEnded={onEnded}
          onStart={() => {
            setIsLoading(false);
          }}
          config={{
            file: {
              attributes: {
                controlsList: controls ? 'nodownload' : undefined,
                disablePictureInPicture: true,
              },
            },
          }}
          playsinline
        />
      </div>
    </div>
  );
};

export default VideoPlayer;

