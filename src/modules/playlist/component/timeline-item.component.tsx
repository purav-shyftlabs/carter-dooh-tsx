import { CSSProperties, useMemo, useState, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Video, Image, Edit, X } from 'lucide-react';
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

  const TypeIcon = useMemo(() => item.type === 'video' ? Video : Image, [item.type]);

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
        <img src={item.thumbnailUrl || item.url} alt={item.name || ''} />
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


