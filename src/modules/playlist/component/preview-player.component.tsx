import { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { usePlaylistStore } from '@/contexts/playlist/playlist.store';
import styles from '../styles/preview-player.module.scss';

type Props = { onClose: () => void };

const PreviewPlayer = ({ onClose }: Props) => {
  const { playlist } = usePlaylistStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const items = playlist.items;
  const current = items[currentIndex];

  const next = () => {
    const atEnd = currentIndex >= items.length - 1;
    if (atEnd) {
      onClose();
      return;
    }
    setCurrentIndex(currentIndex + 1);
  };

  useEffect(() => {
    if (!current) return;
    if (current.type === 'image') {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => next(), Math.max(1, current.duration) * 1000);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [currentIndex, current?.id]);

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
          <div key={current.id} className={styles.crossfade}>
            {current.type === 'image' ? (
              <img src={current.url} alt={current.name || ''} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            ) : (
              <video
                key={`${current.id}-vid`}
                src={current.url}
                poster={current.thumbnailUrl}
                autoPlay
                muted
                playsInline
                controls={false}
                onEnded={next}
                style={{ width: '100%,', height: '100%', objectFit: 'contain', background: '#000' }}
              />
            )}
          </div>
        </div>
        <div className={styles.footer}>
          <div>{currentIndex + 1} / {items.length}</div>
        </div>
      </div>
    </div>
  );
};

export default PreviewPlayer;