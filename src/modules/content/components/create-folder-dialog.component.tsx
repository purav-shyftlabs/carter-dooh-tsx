import React, { useState } from 'react';
import { Button, CarterInput } from 'shyftlabs-dsl';
import { Folder } from '@/types/folder';
import { contentService } from '@/services/content/content.service';
import { Dialog } from './dialog.component';
import styles from '../styles/create-folder-dialog.module.scss';

interface CreateFolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  parentFolder: Folder | null;
  onFolderCreated: (folder: Folder) => void;
}

export const CreateFolderDialog: React.FC<CreateFolderDialogProps> = ({
  isOpen,
  onClose,
  parentFolder,
  onFolderCreated,
}) => {
  const [folderName, setFolderName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!folderName.trim()) {
      setError('Folder name is required');
      return;
    }

    setIsCreating(true);
    setError('');
    setGeneralError(null); // Clear any previous errors

    try {
      const response = await contentService.createFolder({
        name: folderName.trim(),
        parentId: parentFolder?.id ? Number(parentFolder.id) : null,
        allowAllBrands: false,
      });

      onFolderCreated(response.data);
      setFolderName('');
      onClose();
    } catch (err: any) {
      // Debug: Log the error structure to understand what we're dealing with
      console.log('Create folder error:', err);
      console.log('Error response:', err?.response);
      console.log('Error message:', err?.message);
      
      // Parse error message to show user-friendly text
      let errorMessage = 'Failed to create folder';
      
      // Check if it's an axios error with response data
      if (err?.response?.data?.message) {
        const apiMessage = err.response.data.message;
        if (apiMessage.includes('More than one matching record found')) {
          errorMessage = 'A folder with this name already exists in this location';
        } else if (apiMessage.includes('Folder.findOne()')) {
          errorMessage = 'A folder with this name already exists';
        } else if (apiMessage.includes('duplicate') || apiMessage.includes('already exists')) {
          errorMessage = 'A folder with this name already exists in this location';
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
          errorMessage = 'Invalid folder name. Please check your input.';
        } else if (status === 409) {
          errorMessage = 'A folder with this name already exists in this location';
        } else if (status >= 400 && status < 500) {
          errorMessage = 'Invalid request. Please check your folder name.';
        } else if (status >= 500) {
          errorMessage = 'Server error occurred. Please try again.';
        }
      }
      // Check error message for common patterns
      else if (err instanceof Error) {
        if (err.message.includes('Request failed with status code 500')) {
          errorMessage = 'Server error occurred. Please try again.';
        } else if (err.message.includes('Request failed with status code 400')) {
          errorMessage = 'Invalid folder name. Please check your input.';
        } else if (err.message.includes('Request failed with status code 409')) {
          errorMessage = 'A folder with this name already exists in this location';
        } else if (err.message.includes('Request failed with status code')) {
          errorMessage = 'Failed to create folder. Please try again.';
        } else if (err.message.includes('More than one matching record found')) {
          errorMessage = 'A folder with this name already exists in this location';
        } else if (err.message.includes('Folder.findOne()')) {
          errorMessage = 'A folder with this name already exists';
        } else if (err.message.includes('duplicate') || err.message.includes('already exists')) {
          errorMessage = 'A folder with this name already exists in this location';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setGeneralError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setFolderName('');
      setError('');
      setGeneralError(null);
      onClose();
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Folder"
      size="small"
    >
      <form onSubmit={handleSubmit} className={styles.container}>
        {/* {generalError && (
          <div className={styles.generalError}>
            <div className={styles.errorIcon}>⚠️</div>
            <div className={styles.errorMessage}>{generalError}</div>
          </div>
        )} */}
        <div className={styles.content}>
          <p className={styles.description}>
            Create a new folder in {parentFolder ? `"${parentFolder.name}"` : 'root directory'}
          </p>
          
          <CarterInput
            labelProps={{ label: "Folder Name" }}
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="Enter folder name"
            error={!!error}
            disabled={isCreating}
            autoFocus
            required
          />
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <Button
            label="Cancel"
            variant="secondary"
            onClick={handleClose}
            disabled={isCreating}
          />
          <Button
            label={isCreating ? "Creating..." : "Create Folder"}
            variant="primary"
            type="submit"
            disabled={isCreating || !folderName.trim()}
            loading={isCreating}
          />
        </div>
      </form>
    </Dialog>
  );
};
