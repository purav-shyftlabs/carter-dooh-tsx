import { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { usePlaylistStore } from '@/contexts/playlist/playlist.store';
import styles from '../styles/preview-player.module.scss';

type Props = { onClose: () => void };

const PreviewPlayer = ({ onClose }: Props) => {
  const { playlist } = usePlaylistStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [iframeError, setIframeError] = useState(false);
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
    setIframeError(false); // Reset iframe error for next item
  };

  useEffect(() => {
    if (!current) return;
    if (current.type === 'image' || current.type === 'website') {
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
                    onError={() => setIframeError(true)}
                    onLoad={() => setIframeError(false)}
                  />
                </div>
              )
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