import { useState, useEffect } from 'react';
import { Button } from 'shyftlabs-dsl';
import { Video, Image, Globe } from 'lucide-react';
import { RMNInput } from '@/components/input';
import { usePlaylistStore } from '@/contexts/playlist/playlist.store';
import type { PlaylistItem } from '@/types/playlist';
import { Dialog } from '../../content/components/dialog.component';
import styles from '../styles/timeline-item-edit-modal.module.scss';

type Props = {
  item: PlaylistItem;
  isOpen: boolean;
  onClose: () => void;
};

const TimelineItemEditModal = ({ item, isOpen, onClose }: Props) => {
  const { updateItem } = usePlaylistStore();
  const [name, setName] = useState(item.name || '');
  const [duration, setDuration] = useState(item.duration || 1);
  const [url, setUrl] = useState(item.url || '');

  useEffect(() => {
    if (isOpen) {
      setName(item.name || '');
      setDuration(item.duration || 1);
      setUrl(item.url || '');
    }
  }, [isOpen, item]);

  const handleSave = () => {
    const updateData: any = {
      name: name.trim() || undefined,
      duration: Math.max(1, duration),
    };
    
    // For website items, also update the URL
    if (item.type === 'website') {
      updateData.url = url.trim() || undefined;
    }
    
    updateItem(item.id, updateData);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Item"
      size="medium"
    >
      <div className={styles.content}>
        <div className={styles.mediaPreview}>
          {item.type === 'website' ? (
            <div style={{
              width: '100%',
              height: '200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f3f4f6',
              borderRadius: '8px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                borderRadius: '8px',
                position: 'relative'
              }}>
                <iframe
                  src={url || item.url}
                  title={item.name || 'Website'}
                  style={{
                    width: '400px',
                    height: '300px',
                    border: 'none',
                    transform: 'scale(0.5)',
                    transformOrigin: 'top left',
                    position: 'absolute',
                    top: 0,
                    left: 0
                  }}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  onError={() => {
                    console.log('Iframe failed to load:', url || item.url);
                  }}
                />
              </div>
              <div style={{
                position: 'absolute',
                bottom: '8px',
                right: '8px',
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                pointerEvents: 'none'
              }}>
                {(url || item.url).replace(/^https?:\/\//, '').split('/')[0]}
              </div>
            </div>
          ) : (
            <img src={item.thumbnailUrl || item.url} alt={item.name || ''} />
          )}
          <div className={styles.mediaType}>
            {item.type === 'video' ? (
              <>
                <Video size={16} />
                <span>Video</span>
              </>
            ) : item.type === 'website' ? (
              <>
                <Globe size={16} />
                <span>Website</span>
              </>
            ) : (
              <>
                <Image size={16} />
                <span>Image</span>
              </>
            )}
          </div>
        </div>

        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Name</label>
            <RMNInput
              value={name}
              onChange={(e) => setName((e.target as HTMLInputElement).value)}
              placeholder="Item name"
              size="small"
            />
          </div>

          {item.type === 'website' && (
            <div className={styles.field}>
              <label className={styles.label}>Website URL</label>
              <RMNInput
                value={url}
                onChange={(e) => setUrl((e.target as HTMLInputElement).value)}
                placeholder="https://example.com"
                size="small"
              />
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label}>Duration (seconds)</label>
            <RMNInput
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number((e.target as HTMLInputElement).value))}
              size="small"
              disabled={item.type === 'video'}
            />
            {item.type === 'video' && (
              <small className={styles.helpText}>Video duration is auto-detected</small>
            )}
          </div>

        </div>

        <div className={styles.footer}>
          <Button
            label="Cancel"
            variant="secondary"
            size="small"
            onClick={handleCancel}
          />
          <Button
            label="Save"
            variant="primary"
            size="small"
            onClick={handleSave}
          />
        </div>
      </div>
    </Dialog>
  );
};

export default TimelineItemEditModal;
