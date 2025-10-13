import { CSSProperties, useMemo, useState, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Video, Image, Globe, Edit, X } from 'lucide-react';
import { usePlaylistStore } from '@/contexts/playlist/playlist.store';
import type { PlaylistItem } from '@/types/playlist';
import TimelineItemEditModal from './timeline-item-edit-modal.component';
import styles from '../styles/timeline-item.module.scss';

type Props = {
  item: PlaylistItem;
  index: number;
  draggingId: string | null;
};

const TimelineItem = ({ item, index, draggingId }: Props) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const { updateDuration, removeItem } = usePlaylistStore();
  const [showEditModal, setShowEditModal] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
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
          <img src={item.thumbnailUrl || item.url} alt={item.name || ''} />
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
            {item.duration}s
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


