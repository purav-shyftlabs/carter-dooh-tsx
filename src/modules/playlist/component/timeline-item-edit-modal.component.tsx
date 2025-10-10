import { useState, useEffect } from 'react';
import { Button } from 'shyftlabs-dsl';
import { Video, Image } from 'lucide-react';
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
  const [availabilityEnabled, setAvailabilityEnabled] = useState(item.availability?.enabled || false);
  const [startDate, setStartDate] = useState(item.availability?.startDate || '');
  const [endDate, setEndDate] = useState(item.availability?.endDate || '');

  useEffect(() => {
    if (isOpen) {
      setName(item.name || '');
      setDuration(item.duration || 1);
      setAvailabilityEnabled(item.availability?.enabled || false);
      setStartDate(item.availability?.startDate || '');
      setEndDate(item.availability?.endDate || '');
    }
  }, [isOpen, item]);

  const handleSave = () => {
    updateItem(item.id, {
      name: name.trim() || undefined,
      duration: Math.max(1, duration),
      availability: availabilityEnabled ? {
        enabled: true,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      } : { enabled: false },
    });
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
          <img src={item.thumbnailUrl || item.url} alt={item.name || ''} />
          <div className={styles.mediaType}>
            {item.type === 'video' ? (
              <>
                <Video size={16} />
                <span>Video</span>
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

          <div className={styles.field}>
            <label className={styles.label}>Duration (seconds)</label>
            <RMNInput
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number((e.target as HTMLInputElement).value))}
              min={1}
              size="small"
              disabled={item.type === 'video'}
            />
            {item.type === 'video' && (
              <small className={styles.helpText}>Video duration is auto-detected</small>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={availabilityEnabled}
                onChange={(e) => setAvailabilityEnabled(e.target.checked)}
              />
              Availability Schedule
            </label>
          </div>

          {availabilityEnabled && (
            <div className={styles.availabilityFields}>
              <div className={styles.field}>
                <label className={styles.label}>Start Date & Time</label>
                <RMNInput
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate((e.target as HTMLInputElement).value)}
                  size="small"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>End Date & Time</label>
                <RMNInput
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate((e.target as HTMLInputElement).value)}
                  size="small"
                />
              </div>
            </div>
          )}
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
