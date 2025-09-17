import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton, Box } from '@mui/material';
import { carterColors, Typography } from 'shyftlabs-dsl';
import { CloseIcon, CloudUploadIcon } from '@/lib/icons';
import styles from '../styles/general-settings.module.scss';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const ALLOWED_FILE_TYPES = ['.jpeg', '.png'];

interface MediaUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUpload: (file: File) => void;
  aspectRatio?: string;
}

const MediaUploadDialog: React.FC<MediaUploadDialogProps> = ({
  open,
  onClose,
  onUpload,
  aspectRatio = '24px x 100px',
}) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileUpload = (file: File) => {
    const fileExtension = file.name.toLowerCase().match(/\.([^.]+)$/)?.[1];
    const isValidType = ALLOWED_FILE_TYPES.some(type => type.toLowerCase().includes(fileExtension ?? ''));

    if (!isValidType) {
      alert('Please select a valid image file (JPEG or PNG)');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      alert('File size should be less than 5 MB');
      return;
    }

    onUpload(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ m: 0, p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="body-regular" color={carterColors['text-900']}>
            Media Upload
          </Typography>
          <Typography variant="body-regular" color={carterColors['text-600']}>
            Upload the Image
             {/* with aspect ratio: {aspectRatio} */}
          </Typography>
        </Box>
        <IconButton aria-label="close" onClick={onClose} sx={{ color: 'grey.500' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <div
          className={styles.upload_box}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          style={{
            background: dragActive ? 'action.hover' : 'background.paper',
          }}
        >
          <input
            className={styles.hidden_input}
            type="file"
            id="file-upload"
            accept={ALLOWED_FILE_TYPES.join(',')}
            onChange={handleFileSelect}
          />
          <label htmlFor="file-upload">
            <Box sx={{ mb: 2 }}>
              <CloudUploadIcon />
            </Box>
            <Typography variant="body-regular" color={carterColors['text-600']}>
              Drag your file(s) or browse
            </Typography>
            <Typography variant="body-regular" color={carterColors['text-600']}>
              Upload a JPEG or PNG file up to 5 MB in size
            </Typography>
          </label>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaUploadDialog;
