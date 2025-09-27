import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Dialog, DialogTitle, DialogContent, DialogActions, LinearProgress, Chip, Box } from '@mui/material';
import { Button } from 'shyftlabs-dsl';
import { 
  UploadIcon, 
  XIcon, 
  CheckIcon, 
  AlertCircleIcon,
  FileIcon,
  ImageIcon,
  VideoIcon,
  MusicIcon
} from 'lucide-react';
import { 
  ContentFile, 
  UploadFileRequest, 
  UploadMultipleFilesRequest,
  FileUploadProgress 
} from '@/types/content-library';
import { 
  uploadFile, 
  uploadMultipleFiles, 
  formatFileSize, 
  getFileIcon 
} from '@/services/content-library/content-library.service';
import useAlert from '@/contexts/alert/alert.hook';
import { AlertVariant } from '@/contexts/alert/alert.provider';
import styles from '../styles/file-upload-dialog.module.scss';

interface FileUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (files: ContentFile[]) => void;
  currentFolder?: { id: number; name: string } | null;
  allowAllBrands?: boolean;
  brandIds?: number[];
}

const FileUploadDialog: React.FC<FileUploadDialogProps> = ({
  open,
  onClose,
  onSuccess,
  currentFolder,
  allowAllBrands = true,
  brandIds = [],
}) => {
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<ContentFile[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const { showAlert } = useAlert();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newProgress: FileUploadProgress[] = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending',
    }));
    setUploadProgress(prev => [...prev, ...newProgress]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'],
      'video/*': ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'],
      'audio/*': ['.mp3', '.wav', '.flac', '.aac', '.ogg'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/zip': ['.zip'],
      'application/x-rar-compressed': ['.rar'],
    },
    maxSize: 100 * 1024 * 1024, // 100MB
  });

  const removeFile = (index: number) => {
    setUploadProgress(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (uploadProgress.length === 0) return;

    console.log('Upload dialog - currentFolder:', currentFolder);
    console.log('Upload dialog - folderId being used:', currentFolder?.id);

    setIsUploading(true);
    setErrors([]);
    setUploadedFiles([]);

    try {
      if (uploadProgress.length === 1) {
        // Single file upload
        const fileProgress = uploadProgress[0];
        setUploadProgress(prev => 
          prev.map(p => p === fileProgress ? { ...p, status: 'uploading' } : p)
        );

        const request: UploadFileRequest = {
          file: fileProgress.file,
          folderId: currentFolder?.id,
          allowAllBrands,
          brandIds: allowAllBrands ? undefined : brandIds,
        };

        const response = await uploadFile(request);
        
        if (response.status === 'success') {
          setUploadProgress(prev => 
            prev.map(p => p === fileProgress ? { ...p, status: 'completed', progress: 100 } : p)
          );
          setUploadedFiles([response.data]);
          showAlert('File uploaded successfully', AlertVariant.SUCCESS);
        } else {
          setUploadProgress(prev => 
            prev.map(p => p === fileProgress ? { 
              ...p, 
              status: 'error', 
              error: response.message 
            } : p)
          );
          setErrors(prev => [...prev, `${fileProgress.file.name}: ${response.message}`]);
        }
      } else {
        // Multiple files upload
        const files = uploadProgress.map(p => p.file);
        const request: UploadMultipleFilesRequest = {
          files,
          folderId: currentFolder?.id,
          allowAllBrands,
          brandIds: allowAllBrands ? undefined : brandIds,
        };

        const response = await uploadMultipleFiles(request);
        
        if (response.status === 'success') {
          setUploadedFiles(response.data.uploaded);
          setErrors(response.data.errors.map(e => `${e.filename}: ${e.error}`));
          
          // Update progress for successful uploads
          setUploadProgress(prev => 
            prev.map(p => {
                const uploaded = response.data.uploaded.find(f => f.originalFilename === p.file.name);
              if (uploaded) {
                return { ...p, status: 'completed', progress: 100 };
              }
              const error = response.data.errors.find(e => e.filename === p.file.name);
              if (error) {
                return { ...p, status: 'error', error: error.error };
              }
              return p;
            })
          );

          if (response.data.summary.successful > 0) {
            showAlert(
              `Uploaded ${response.data.summary.successful} of ${response.data.summary.total} files successfully`,
              AlertVariant.SUCCESS
            );
          }
        } else {
          setErrors([response.message || 'Upload failed']);
          setUploadProgress(prev => 
            prev.map(p => ({ ...p, status: 'error', error: response.message }))
          );
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      setErrors(['Upload failed']);
      setUploadProgress(prev => 
        prev.map(p => ({ ...p, status: 'error', error: 'Upload failed' }))
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setUploadProgress([]);
      setUploadedFiles([]);
      setErrors([]);
      onClose();
    }
  };

  const handleSuccess = () => {
    onSuccess(uploadedFiles);
    handleClose();
  };

  const getFileIconComponent = (file: File) => {
    const type = file.type;
    if (type.startsWith('image/')) return <ImageIcon size={20} />;
    if (type.startsWith('video/')) return <VideoIcon size={20} />;
    if (type.startsWith('audio/')) return <MusicIcon size={20} />;
    return <FileIcon size={20} />;
  };

  const getStatusIcon = (status: FileUploadProgress['status']) => {
    switch (status) {
      case 'completed':
        return <CheckIcon size={16} className={styles.successIcon} />;
      case 'error':
        return <AlertCircleIcon size={16} className={styles.errorIcon} />;
      case 'uploading':
        return <LinearProgress variant="indeterminate" className={styles.progressBar} />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Upload Files</DialogTitle>
      <DialogContent>
        <div className={styles.uploadContent}>
          {/* Drop zone */}
          <div
            {...getRootProps()}
            className={`${styles.dropZone} ${isDragActive ? styles.dragActive : ''}`}
          >
            <input {...getInputProps()} />
            <UploadIcon size={48} className={styles.uploadIcon} />
            <p className={styles.dropText}>
              {isDragActive
                ? 'Drop the files here...'
                : 'Drag & drop files here, or click to select files'
              }
            </p>
            <p className={styles.dropSubtext}>
              Supports images, videos, documents, and more (max 100MB per file)
            </p>
          </div>

          {/* File list */}
          {uploadProgress.length > 0 && (
            <div className={styles.fileList}>
              <h4>Files to Upload ({uploadProgress.length})</h4>
              {uploadProgress.map((progress, index) => (
                <div key={index} className={styles.fileItem}>
                  <div className={styles.fileInfo}>
                    {getFileIconComponent(progress.file)}
                    <div className={styles.fileDetails}>
                      <div className={styles.fileName}>{progress.file.name}</div>
                      <div className={styles.fileSize}>
                        {formatFileSize(progress.file.size)}
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.fileStatus}>
                    {getStatusIcon(progress.status)}
                    {progress.status === 'error' && progress.error && (
                      <span className={styles.errorText}>{progress.error}</span>
                    )}
                  </div>
                  
                  {progress.status === 'pending' && (
                    <button
                      className={styles.removeButton}
                      onClick={() => removeFile(index)}
                      disabled={isUploading}
                    >
                      <XIcon size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className={styles.errors}>
              <h4>Errors</h4>
              {errors.map((error, index) => (
                <div key={index} className={styles.errorItem}>
                  <AlertCircleIcon size={16} />
                  <span>{error}</span>
                </div>
              ))}
            </div>
          )}

          {/* Upload info */}
          {currentFolder && (
            <div className={styles.uploadInfo}>
              <Chip 
                label={`Uploading to: ${currentFolder.name || 'Root'}`} 
                size="small" 
                color="primary" 
              />
            </div>
          )}
        </div>
      </DialogContent>
      
      <DialogActions className={styles.dialogActions}>
        <Button
          variant="secondary"
          onClick={handleClose}
          disabled={isUploading}
        >
          {uploadedFiles.length > 0 ? 'Close' : 'Cancel'}
        </Button>
        
        {uploadedFiles.length > 0 ? (
          <Button
            variant="primary"
            onClick={handleSuccess}
          >
            Done
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={uploadFiles}
            disabled={uploadProgress.length === 0 || isUploading}
            loading={isUploading}
          >
            Upload {uploadProgress.length} File{uploadProgress.length !== 1 ? 's' : ''}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};  

export default FileUploadDialog;
