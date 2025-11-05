import { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { usePlaylistStore } from '@/contexts/playlist/playlist.store';
import { contentService } from '@/services/content/content.service';
import signedUrlService from '@/services/content/signed-url.service';
import styles from '../styles/preview-player.module.scss';

type Props = { onClose: () => void };

const PreviewPlayer = ({ onClose }: Props) => {
  const { playlist } = usePlaylistStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [iframeError, setIframeError] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [videoPoster, setVideoPoster] = useState<string | null>(null);
  const [displayUrls, setDisplayUrls] = useState<Record<string, string>>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const items = playlist.items;
  const current = items[currentIndex];

  // Function to capture first frame of video
  const captureVideoFirstFrame = (videoUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        // Seek to first frame (0.1 seconds to ensure frame is loaded)
        video.currentTime = 0.1;
      };
      
      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataURL = canvas.toDataURL('image/jpeg', 0.8);
            video.remove();
            resolve(dataURL);
          } else {
            video.remove();
            reject(new Error('Could not get canvas context'));
          }
        } catch (error) {
          video.remove();
          reject(error);
        }
      };
      
      video.onerror = () => {
        video.remove();
        reject(new Error('Failed to load video'));
      };
      
      video.src = videoUrl;
    });
  };

  const next = () => {
    const atEnd = currentIndex >= items.length - 1;
    if (atEnd) {
      onClose();
      return;
    }
    
    setIsTransitioning(true);
    setIsLoading(true);
    setTimeout(() => {
      setCurrentIndex(currentIndex + 1);
      setIframeError(false); // Reset iframe error for next item
      setIsTransitioning(false);
      setIsLoading(false);
    }, 300); // 300ms transition
  };

  useEffect(() => {
    if (!current) return;
    if (current.type === 'image' || current.type === 'website') {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => next(), Math.max(1, current.duration) * 1000);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [currentIndex, current?.id]);

  // Get signed URLs for display (only for images and videos)
  useEffect(() => {
    const getDisplayUrls = async () => {
      const newDisplayUrls: Record<string, string> = {};
      
      for (const item of items) {
        // Only get signed URLs for images and videos, not websites
        if (!displayUrls[item.id] && (item.type === 'image' || item.type === 'video')) {
          try {
            // Create a mock file object for the signed URL service
            const mockFile = {
              id: item.assetId,
              fileUrl: item.url,
              content_type: item.type === 'video' ? 'video/mp4' : 'image/jpeg',
              name: item.name || '',
              original_filename: item.name || '',
              folder_id: 0,
              account_id: 0,
              owner_id: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              storage_key: '',
              file_size: 0,
              allow_all_brands: true,
              metadata: {}
            };
            
            // Call the signed URL API
            const signedUrl = await signedUrlService.getFileSignedUrl(mockFile);
            newDisplayUrls[item.id] = signedUrl;
          } catch (error) {
            console.warn(`Failed to get signed URL for item ${item.id}, using original URL:`, error);
            newDisplayUrls[item.id] = item.url;
          }
        } else if (item.type === 'website') {
          // For websites, use the original URL directly
          newDisplayUrls[item.id] = item.url;
        }
      }
      
      if (Object.keys(newDisplayUrls).length > 0) {
        setDisplayUrls(prev => ({ ...prev, ...newDisplayUrls }));
      }
    };
    
    if (items.length > 0) {
      getDisplayUrls();
    }
  }, [items, displayUrls]);

  // Capture first frame for videos
  useEffect(() => {
    if (current && current.type === 'video') {
      setVideoPoster(null); // Reset poster
      
      // Use signed URL for first frame capture if available, otherwise use original URL
      const videoUrl = displayUrls[current.id] || current.url;
      
      captureVideoFirstFrame(videoUrl)
        .then((posterUrl) => {
          setVideoPoster(posterUrl);
        })
        .catch((error) => {
          console.warn('Failed to capture video first frame:', error);
          setVideoPoster(null);
        });
    } else {
      setVideoPoster(null);
    }
  }, [current, displayUrls]);

  // Preload next item for smooth transitions
  useEffect(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < items.length) {
      const nextItem = items[nextIndex];
      const nextItemUrl = displayUrls[nextItem.id] || nextItem.url;
      
      if (nextItem.type === 'image') {
        const img = new Image();
        img.src = nextItemUrl;
      } else if (nextItem.type === 'video') {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = nextItemUrl;
      }
    }
  }, [currentIndex, items, displayUrls]);

  if (!current) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.title}>Preview</div>
          <button className={styles.close} onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className={styles.body}>
          <div 
            key={current.id} 
            className={styles.crossfade}
            style={{
              opacity: isTransitioning ? 0 : 1,
              transition: 'opacity 0.3s ease-in-out',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              // backgroundColor: '#000',
              position: 'relative'
            }}
          >
            {/* Loading indicator
            {isLoading && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: 'white',
                fontSize: '18px',
                zIndex: 10
              }}>
                
              </div>
            )} */}
            {current.type === 'image' ? (
              <img 
                src={displayUrls[current.id] || current.url} 
                alt={current.name || ''} 
                onLoad={() => setIsLoading(false)}
                onError={() => setIsLoading(false)}
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '100%', 
                  objectFit: 'contain',
                  transition: 'opacity 0.3s ease-in-out'
                }} 
              />
            ) : current.type === 'website' ? (
              iframeError ? (
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '8px',
                  padding: '20px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌐</div>
                  <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                    {current.name || 'Website'}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
                    {current.url}
                  </div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                    Website cannot be embedded due to security restrictions
                  </div>
                </div>
              ) : (
                <div className={styles.iframeContainer}>
                  <iframe
                    src={current.url}
                    title={current.name || 'Website'}
                    style={{ 
                      width: '1920px', // Full desktop width
                      height: '1080px', // Full desktop height
                      border: 'none',
                      transform: 'scale(0.5)', // Scale to fit preview screen
                      transformOrigin: 'top left',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      isolation: 'isolate', // CSS isolation
                      contain: 'layout style paint' // Prevent style leakage
                    }}
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                    allow="fullscreen"
                    onError={() => {
                      setIframeError(true);
                      setIsLoading(false);
                    }}
                    onLoad={() => {
                      setIframeError(false);
                      setIsLoading(false);
                    }}
                  />
                </div>
              )
            ) : (
              <video
                key={`${current.id}-vid`}
                src={displayUrls[current.id] || current.url}
                poster={videoPoster || current.thumbnailUrl}
                autoPlay
                muted
                playsInline
                controls={false}
                onEnded={next}
                onLoadStart={() => {
                  // Ensure smooth video loading
                  setIsLoading(false);
                }}
                onCanPlay={() => {
                  setIsLoading(false);
                }}
                height="450"
                style={{  
                  width: '100%',
                  objectFit: 'contain', 
                }}
              />
            )}
          </div>
        </div>
        <div className={styles.footer}>
          <div>{currentIndex + 1} / {items.length}</div>
          {current.type === 'website' && (
            <button 
              onClick={next}
              style={{
                padding: '8px 16px',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreviewPlayer;