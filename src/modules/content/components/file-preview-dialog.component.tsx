import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, IconButton, CircularProgress } from '@mui/material';
import { Button } from 'shyftlabs-dsl';
import { 
  XIcon, 
  DownloadIcon, 
  EditIcon, 
  TrashIcon,
  ImageIcon,
  VideoIcon,
  MusicIcon,
  FileIcon,
  FileTextIcon
} from 'lucide-react';
import { ContentFile } from '@/types/content-library';
import { 
  formatFileSize, 
  formatDate, 
  getFileIcon,
  downloadFile 
} from '@/services/content-library/content-library.service';
import useAlert from '@/contexts/alert/alert.hook';
import { AlertVariant } from '@/contexts/alert/alert.provider';
import styles from '../styles/file-preview-dialog.module.scss';

interface FilePreviewDialogProps {
  open: boolean;
  onClose: () => void;
  file: ContentFile | null;
  onEdit?: (file: ContentFile) => void;
  onDelete?: (file: ContentFile) => void;
}

const FilePreviewDialog: React.FC<FilePreviewDialogProps> = ({
  open,
  onClose,
  file,
  onEdit,
  onDelete,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showAlert } = useAlert();

  useEffect(() => {
    if (file && open) {
      loadPreview();
    } else {
      setPreviewUrl(null);
      setError(null);
    }
  }, [file, open]);

  const loadPreview = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      // For images, videos, and audio, we can show inline preview
      if (file.contentType?.startsWith('image/')) {
          setPreviewUrl(file.fileUrl || `/api/files/${file.id}/serve`);
      } else if (file.contentType?.startsWith('video/')) {
        setPreviewUrl(file.fileUrl || `/api/files/${file.id}/serve`);
      } else if (file.contentType?.startsWith('audio/')) {
        setPreviewUrl(file.fileUrl || `/api/files/${file.id}/serve`);
      } else {
        // For other file types, we'll show file info only
        setPreviewUrl(null);
      }
    } catch (err) {
      setError('Failed to load preview');
      console.error('Preview error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!file) return;

    try {
      const blob = await downloadFile(file.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalFilename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showAlert('File downloaded successfully', AlertVariant.SUCCESS);
    } catch (error) {
      console.error('Download error:', error);
      showAlert('Failed to download file', AlertVariant.ERROR);
    }
  };

  const handleDelete = () => {
    if (file && window.confirm(`Are you sure you want to delete "${file.name}"?`)) {
      onDelete?.(file);
      onClose();
    }
  };

  const getFileTypeIcon = () => {
    if (!file) return <FileIcon size={48} />;
    
    const type = file.contentType || '';
    if (type.startsWith('image/')) return <ImageIcon size={48} />;
    if (type.startsWith('video/')) return <VideoIcon size={48} />;
    if (type.startsWith('audio/')) return <MusicIcon size={48} />;
    if (type.includes('pdf') || type.includes('text')) return <FileTextIcon size={48} />;
    return <FileIcon size={48} />;
  };

  const canPreview = file && (
    file.contentType?.startsWith('image/') ||
    file.contentType?.startsWith('video/') ||
    file.contentType?.startsWith('audio/')
  );

  if (!file) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle className={styles.dialogTitle}>
        <div className={styles.titleContent}>
          <span className={styles.fileIcon}>{getFileIcon(file.contentType || '')}</span>
          <div className={styles.fileInfo}>
            <h3>{file.name}</h3>
            <p>{file.originalFilename}</p>
          </div>
        </div>
        <IconButton onClick={onClose} size="small">
          <XIcon size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent className={styles.dialogContent}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <CircularProgress />
            <p>Loading preview...</p>
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <p>{error}</p>
          </div>
        ) : canPreview && previewUrl ? (
          <div className={styles.previewContainer}>
            {file.contentType?.startsWith('image/') && (
              <img 
                src={previewUrl} 
                alt={file.name}
                className={styles.previewImage}
                onError={() => setError('Failed to load image preview')}
              />
            )}
            {file.contentType?.startsWith('video/') && (
              <video 
                src={previewUrl} 
                controls 
                className={styles.previewVideo}
                onError={() => setError('Failed to load video preview')}
              >
                Your browser does not support the video tag.
              </video>
            )}
            {file.contentType?.startsWith('audio/') && (
              <audio 
                src={previewUrl} 
                controls 
                className={styles.previewAudio}
                onError={() => setError('Failed to load audio preview')}
              >
                Your browser does not support the audio tag.
              </audio>
            )}
          </div>
        ) : (
          <div className={styles.noPreviewContainer}>
            {getFileTypeIcon()}
            <h4>Preview not available</h4>
            <p>This file type cannot be previewed in the browser.</p>
            <p>Click download to view the file.</p>
          </div>
        )}

        <div className={styles.fileDetails}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>File Size:</span>
            <span className={styles.detailValue}>
              {file.fileSize ? formatFileSize(file.fileSize) : 'Unknown'}
            </span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>File Type:</span>
            <span className={styles.detailValue}>
              {file.contentType || 'Unknown'}
            </span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Created:</span>
            <span className={styles.detailValue}>
              {formatDate(file.createdAt)}
            </span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Modified:</span>
            <span className={styles.detailValue}>
              {formatDate(file.updatedAt)}
            </span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Brand Access:</span>
            <span className={styles.detailValue}>
                {file.allowAllBrands ? 'All Brands' : 'Specific Brands'}
            </span>
          </div>
        </div>
      </DialogContent>

      <DialogActions className={styles.dialogActions}>
        <Button
          variant="secondary"
          onClick={onClose}
        >
          Close
        </Button>
        
        <div className={styles.actionButtons}>
          {onEdit && (
            <Button
              variant="secondary"
              icon={<EditIcon />}
              onClick={() => onEdit(file)}
            >
              Edit
            </Button>
          )}
          
          <Button
            variant="secondary"
            icon={<DownloadIcon />}
            onClick={handleDownload}
          >
            Download
          </Button>
          
          {onDelete && (
            <Button
              variant="danger"
              icon={<TrashIcon />}
              onClick={handleDelete}
            >
              Delete
            </Button>
          )}
        </div>
      </DialogActions>
    </Dialog>
  );
};

export default FilePreviewDialog;
