import { CSSProperties, useMemo, useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Video, Image, Globe, Edit, X } from 'lucide-react';
import { usePlaylistStore } from '@/contexts/playlist/playlist.store';
import type { PlaylistItem } from '@/types/playlist';
import signedUrlService from '@/services/content/signed-url.service';
import TimelineItemEditModal from './timeline-item-edit-modal.component';
import styles from '../styles/timeline-item.module.scss';

type Props = {
  item: PlaylistItem;
  index: number;
  draggingId: string | null;
  isDetectingDuration?: boolean;
  onRetryDuration?: () => void;
};

const TimelineItem = ({ item, index, draggingId, isDetectingDuration = false, onRetryDuration }: Props) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const { updateDuration, removeItem } = usePlaylistStore();
  const [showEditModal, setShowEditModal] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loadingSignedUrl, setLoadingSignedUrl] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);

  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const TypeIcon = useMemo(() => {
    if (item.type === 'video') return Video;
    if (item.type === 'website') return Globe;
    return Image;
  }, [item.type]);

  // Fetch signed URL for the item (only for images and videos)
  useEffect(() => {
    const fetchSignedUrl = async () => {
      // Only get signed URLs for images and videos, not websites
      if (item.type === 'website' || !item.url || (item.type !== 'image' && item.type !== 'video')) return;
      
      setLoadingSignedUrl(true);
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
        
        const url = await signedUrlService.getFileSignedUrl(mockFile);
        setSignedUrl(url);
      } catch (error) {
        console.warn(`Failed to get signed URL for item ${item.id}:`, error);
        setSignedUrl(null);
      } finally {
        setLoadingSignedUrl(false);
      }
    };

    fetchSignedUrl();
  }, [item.id, item.url, item.type, item.assetId, item.name]);


  const handleEditClick = () => {
    setShowEditModal(true);
  };

  return (
    <>
      <div 
        ref={(node) => {
          setNodeRef(node);
          itemRef.current = node;
        }} 
        className={styles.item} 
        style={style} 
        {...attributes} 
        {...listeners}
      >
      <div className={styles.thumb}>
        {item.type === 'website' ? (
          <div style={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f3f4f6',
            borderRadius: '4px',
            position: 'relative'
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              borderRadius: '4px',
              position: 'relative'
            }}>
              <iframe 
                src={item.url} 
                title={item.name || 'Website'}
                style={{ 
                  width: '400px', // Optimized size for thumbnail
                  height: '300px', // Optimized size for thumbnail
                  border: 'none',
                  transform: 'scale(0.5)', // Scale down to fit thumbnail
                  transformOrigin: 'top left',
                  position: 'absolute',
                  top: 0,
                  left: 0
                }}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                onError={() => {
                  // Fallback if iframe fails to load
                  console.log('Iframe failed to load:', item.url);
                }}
              />
            </div>
            <div style={{
              position: 'absolute',
              bottom: '4px',
              right: '4px',
              backgroundColor: 'rgba(0,0,0,0.7)',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              pointerEvents: 'none'
            }}>
              {item.url.replace(/^https?:\/\//, '').split('/')[0]}
            </div>
          </div>
        ) : (
          <img 
            src={
              loadingSignedUrl
                ? 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMEMyMi4yMDkxIDIwIDI0IDE4LjIwOTEgMjQgMTZDMjQgMTMuNzkwOSAyMi4yMDkxIDEyIDIwIDEyQzE3Ljc5MDkgMTIgMTYgMTMuNzkwOSAxNiAxNkMxNiAxOC4yMDkxIDE3Ljc5MDkgMjAgMjAgMjBaIiBmaWxsPSIjOUI5QjlCIi8+CjxwYXRoIGQ9Ik0yMCAyNkMyMi4yMDkxIDI2IDI0IDI0LjIwOTEgMjQgMjJDMjQgMTkuNzkwOSAyMi4yMDkxIDE4IDIwIDE4QzE3Ljc5MDkgMTggMTYgMTkuNzkwOSAxNiAyMkMxNiAyNC4yMDkxIDE3Ljc5MDkgMjYgMjAgMjZaIiBmaWxsPSIjOUI5QjlCIi8+Cjwvc3ZnPgo=' 
                : signedUrl || item.thumbnailUrl || item.url
            } 
            alt={item.name || ''} 
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '4px'
            }}
          />
        )}
        <div className={styles.type}>
          <TypeIcon size={16} />
        </div>
        <div className={styles.indexBadge}>{index + 1}</div>
        <button className={styles.editHover} onClick={handleEditClick} aria-label="edit item">
          <Edit size={14} />
        </button>
        <button className={styles.deleteHover} onClick={() => removeItem(item.id)} aria-label="delete item">
          <X size={14} />
        </button>
      </div>
      <div className={styles.meta}>
        {/* <div className={styles.name}>{item.name || 'Untitled'}</div> */}
        <div className={styles.controls}></div>
        <div className={styles.durationBar}>
          <button
            className={styles.stepBtn}
            onClick={() => updateDuration(item.id, Math.max(1, (item.duration || 1) - 1))}
            disabled={item.type === 'video'}
            aria-label="decrease duration"
          >−</button>
          <div className={styles.durationValue} aria-label="duration value">
            {isDetectingDuration ? (
              <span style={{ color: '#666', fontSize: '10px' }}>Detecting...</span>
            ) : item.type === 'video' && item.duration === 10 && onRetryDuration ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <span style={{ fontSize: '10px' }}>{item.duration}s</span>
                <button 
                  onClick={onRetryDuration}
                  style={{ 
                    fontSize: '8px', 
                    padding: '1px 3px', 
                    background: '#f3f4f6', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '2px',
                    cursor: 'pointer'
                  }}
                  title="Retry duration detection"
                >
                  Retry
                </button>
              </div>
            ) : (
              `${item.duration}s`
            )}
          </div>
          <button
            className={styles.stepBtn}
            onClick={() => updateDuration(item.id, Math.max(1, (item.duration || 1) + 1))}
            disabled={item.type === 'video'}
            aria-label="increase duration"
          >+</button>
        </div>
      </div>
      </div>
      
      <TimelineItemEditModal
        item={item}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
      />
    </>
  );
};

export default TimelineItem;


