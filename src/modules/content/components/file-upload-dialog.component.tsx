import React, { useState, useRef, useCallback } from 'react';
import { Button } from 'shyftlabs-dsl';
import { Folder, File, FileUploadProgress } from '@/types/folder';
import { contentService } from '@/services/content/content.service';
import { useBrands } from '@/hooks/useBrands.hook';
import { Dialog } from './dialog.component';
import { ProgressBar } from './progress-bar.component';
import styles from '../styles/file-upload-dialog.module.scss';
import { Upload as UploadIcon, File as FileIcon } from 'lucide-react';

interface FileUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentFolder: Folder | null;
  onUploadComplete: (files: File[]) => void;
}

export const FileUploadDialog: React.FC<FileUploadDialogProps> = ({
  isOpen,
  onClose,
  currentFolder,
  onUploadComplete,
}) => {
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [allowAllBrands, setAllowAllBrands] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<number[]>([]);
  const [description, setDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Fetch brands
  const { brands, loading: brandsLoading, error: brandsError } = useBrands();
  
  // Debug logging
  React.useEffect(() => {
    console.log('FileUploadDialog - brands:', brands);
    console.log('FileUploadDialog - brandsLoading:', brandsLoading);
    console.log('FileUploadDialog - brandsError:', brandsError);
  }, [brands, brandsLoading, brandsError]);


  const uploadFiles = useCallback(async (files: globalThis.File[]) => {
    setIsUploading(true);
    setGeneralError(null); // Clear any previous errors
    const uploadedFiles: File[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
          // Convert file to base64
          const base64Data = await contentService.fileToBase64(file);
          
          // Update progress
          setUploadProgress(prev => 
            prev.map((item, index) => 
              index === i ? { ...item, progress: 50 } : item
            )
          );

          // Step 1: Upload file
          const uploadResponse = await contentService.uploadFile({
            fileData: base64Data,
            filename: file.name,
            mimeType: file.type,
            folderId: currentFolder?.id ? Number(currentFolder.id) : null,
            allowAllBrands,
            selectedBrands: allowAllBrands ? [] : selectedBrands,
          });

          // Step 2: Set file metadata and ACL
          console.log('File upload - allowAllBrands state:', allowAllBrands); // Debug log
          console.log('File upload - selectedBrands state:', selectedBrands); // Debug log
          const metadataResponse = await contentService.setFileMetadata(uploadResponse.data.fileId, {
            status: 'active',
            description: description.trim() || `Uploaded file: ${file.name}`
          });

          uploadedFiles.push(metadataResponse.data);

          // Update progress to completed
          setUploadProgress(prev => 
            prev.map((item, index) => 
              index === i ? { ...item, progress: 100, status: 'completed' } : item
            )
          );
        } catch (error: unknown) {
          const err = (error ?? {}) as { response?: { status?: number; data?: { message?: string } }; message?: string };
          // Debug: Log the error structure to understand what we're dealing with
          console.log('Upload error:', err);
          console.log('Error response:', err?.response);
          console.log('Error message:', err?.message);
          
          // Parse error message to show user-friendly text
          let errorMessage = 'Upload failed';
          
          // Check if it's an axios error with response data
          if (err?.response?.data?.message) {
            const apiMessage = err.response.data.message;
            if (apiMessage.includes('More than one matching record found')) {
              errorMessage = 'File with this name already exists in this folder';
            } else if (apiMessage.includes('Upload failed:')) {
              const parts = apiMessage.split('Upload failed:');
              if (parts.length > 1) {
                const mainError = parts[1].trim();
                if (mainError.includes('More than one matching record')) {
                  errorMessage = 'File with this name already exists in this folder';
                } else {
                  errorMessage = 'Upload failed: ' + mainError.split('\n')[0];
                }
              }
            } else {
              errorMessage = apiMessage;
            }
          }
          // Check for HTTP status errors
          else if (err?.response?.status) {
            const status = err.response.status;
            if (status === 500) {
              errorMessage = 'Server error occurred. Please try again.';
            } else if (status === 400) {
              errorMessage = 'Invalid file or request. Please check your file.';
            } else if (status === 413) {
              errorMessage = 'File is too large. Please choose a smaller file.';
            } else if (status === 409) {
              errorMessage = 'File with this name already exists in this folder';
            } else if (status >= 400 && status < 500) {
              errorMessage = 'Invalid request. Please check your file.';
            } else if (status >= 500) {
              errorMessage = 'Server error occurred. Please try again.';
            }
          }
          // Check error message for common patterns
          else if (typeof (err as { message?: string }).message === 'string') {
            const msg = String((err as { message?: string }).message || '');
            if (msg.includes('Request failed with status code 500')) {
              errorMessage = 'Server error occurred. Please try again.';
            } else if (msg.includes('Request failed with status code 400')) {
              errorMessage = 'Invalid file or request. Please check your file.';
            } else if (msg.includes('Request failed with status code 413')) {
              errorMessage = 'File is too large. Please choose a smaller file.';
            } else if (msg.includes('Request failed with status code 409')) {
              errorMessage = 'File with this name already exists in this folder';
            } else if (msg.includes('Request failed with status code')) {
              errorMessage = 'Upload failed. Please try again.';
            } else if (msg.includes('More than one matching record found')) {
              errorMessage = 'File with this name already exists in this folder';
            } else if (msg.includes('File.findOne()')) {
              errorMessage = 'File already exists in this location';
            } else if (msg.includes('Upload failed:')) {
              const parts = msg.split('Upload failed:');
              if (parts.length > 1) {
                const mainError = parts[1].trim();
                if (mainError.includes('More than one matching record')) {
                  errorMessage = 'File with this name already exists in this folder';
                } else {
                  errorMessage = 'Upload failed: ' + mainError.split('\n')[0];
                }
              }
            } else {
              errorMessage = msg;
            }
          }
          
          // Update progress to error
          setUploadProgress(prev => 
            prev.map((item, index) => 
              index === i ? { 
                ...item, 
                progress: 0, 
                status: 'error',
                error: errorMessage
              } : item
            )
          );
          
          // Set general error message for the first error
          setGeneralError(prev => prev ?? errorMessage);
        }
      }
    } finally {
      setIsUploading(false);
    }

    if (uploadedFiles.length > 0) {
      onUploadComplete(uploadedFiles);
    }
  }, [currentFolder, onUploadComplete, allowAllBrands, selectedBrands, description]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const progressItems: FileUploadProgress[] = files.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const,
    }));

    setUploadProgress(progressItems);
    uploadFiles(files);
  }, [uploadFiles]);

  const handleClose = () => {
    if (!isUploading) {
      setUploadProgress([]);
      setGeneralError(null);
      setAllowAllBrands(false);
      setSelectedBrands([]);
      setDescription('');
      onClose();
    }
  };

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      const progressItems: FileUploadProgress[] = files.map(file => ({
        file,
        progress: 0,
        status: 'uploading' as const,
      }));
      setUploadProgress(progressItems);
      uploadFiles(files);
    }
  }, [uploadFiles]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const allUploadsComplete = uploadProgress.length > 0 && uploadProgress.every(item => 
    item.status === 'completed' || item.status === 'error'
  );

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title="Upload Files"
      size="medium"
    >
      <div className={styles.container}>
        {/* {generalError && (
          <div className={styles.generalError}>
            <div className={styles.errorIcon}>⚠️</div>
            <div className={styles.errorMessage}>{generalError}</div>
          </div>
        )} */}
        {uploadProgress.length === 0 ? (
          <>
            <div className={styles.metadataSection}>
              <h4>File Metadata</h4>
              
              <div className={styles.inputGroup}>
                <label className={styles.label}>Description (Optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter file description"
                  className={styles.textInput}
                  disabled={isUploading}
                />
              </div>
              
              <div className={styles.brandSection}>
                <label className={styles.label}>Brand Access</label>
                <div className={styles.brandOptions}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={allowAllBrands}
                      onChange={(e) => {
                        console.log('Checkbox changed to:', e.target.checked); // Debug log
                        setAllowAllBrands(e.target.checked);
                      }}
                      disabled={isUploading}
                    />
                    Allow all brands to access these files
                  </label>
                </div>
                
                {!allowAllBrands && (
                  <div className={styles.brandSelection}>
                    <label className={styles.label}>Select Specific Brands</label>
                    {brandsLoading ? (
                      <div className={styles.loading}>Loading brands...</div>
                    ) : brandsError ? (
                      <div className={styles.errorMessage}>
                        Error loading brands: {brandsError}
                      </div>
                    ) : (
                      <div className={styles.brandList}>
                        {Array.isArray(brands) && brands.length > 0 ? (
                          brands.map(brand => (
                            <label key={brand.id} className={styles.brandItem}>
                              <input
                                type="checkbox"
                                checked={selectedBrands.includes(brand.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedBrands(prev => [...prev, brand.id]);
                                  } else {
                                    setSelectedBrands(prev => prev.filter(id => id !== brand.id));
                                  }
                                }}
                                disabled={isUploading}
                              />
                              <span>{brand.name}</span>
                            </label>
                          ))
                        ) : (
                          <div className={styles.noBrands}>No brands available</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div
              className={styles.dropZone}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className={styles.dropZoneContent}>
                <div className={styles.uploadIcon}>
                  <UploadIcon />
                </div>
                <h3>Drop files here or click to browse</h3>
                <p>Upload files to {currentFolder ? `"${currentFolder.name}"` : 'root folder'}</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </div>
            </div>
          </>
        ) : (
          <div className={styles.uploadProgress}>
            <h3>Uploading Files</h3>
            {uploadProgress.map((item, index) => (
              <div key={index} className={styles.progressItem}>
                <div className={styles.fileInfo}>
                  <span className={styles.fileIcon}>
                    <FileIcon />
                  </span>
                  <span className={styles.fileName}>{item.file.name}</span>
                  <span className={styles.fileSize}>
                    {contentService.formatFileSize(item.file.size)}
                  </span>
                </div>
                <div className={styles.progressContainer}>
                  <ProgressBar
                    value={item.progress}
                    max={100}
                    size="small"
                    variant={item.status === 'error' ? 'error' : 'primary'}
                  />
                  <span className={`${styles.status} ${item.status === 'completed' ? styles.success : item.status === 'error' ? styles.error : ''}`}>
                    {item.status === 'uploading' && `${item.progress}%`}
                    {item.status === 'completed' && '✓ Complete'}
                    {item.status === 'error' && `✗ ${item.error}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={styles.actions}>
          <Button
            label={allUploadsComplete ? "Close" : "Cancel"}
            variant="secondary"
            onClick={handleClose}
            disabled={isUploading && !allUploadsComplete}
          />
        </div>
      </div>
    </Dialog>
  );
};
