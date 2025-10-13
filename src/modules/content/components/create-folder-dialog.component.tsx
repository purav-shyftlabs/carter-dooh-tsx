import React, { useState } from 'react';
import { Button, CarterInput, CarterRadioGroup, TabularAutocomplete } from 'shyftlabs-dsl';
import { Folder, Brand } from '@/types/folder';
import { contentService } from '@/services/content/content.service';
import { useBrands } from '@/hooks/useBrands.hook';
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
  const [description, setDescription] = useState('');
  const [allowAllBrands, setAllowAllBrands] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<number[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [generalError, setGeneralError] = useState<string | null>(null);
  
  // Fetch brands
  const { brands, loading: brandsLoading, error: brandsError } = useBrands();
  
  // Brand columns for TabularAutocomplete
  const brandColumns = [
    {
      accessorKey: 'name',
      header: 'Brand Name',
      cell: ({ row }: { row: { original: Brand } }) => row.original.name || String(row.original.id),
    },
  ];
  
  // Debug logging
  React.useEffect(() => {
    console.log('CreateFolderDialog - brands:', brands);
    console.log('CreateFolderDialog - brandsLoading:', brandsLoading);
    console.log('CreateFolderDialog - brandsError:', brandsError);
  }, [brands, brandsLoading, brandsError]);

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
        allowAllBrands,
        selectedBrands: allowAllBrands ? [] : selectedBrands,
        status: 'active',
        description: description.trim() || undefined
      });

      onFolderCreated(response.data);
      setFolderName('');
      onClose();
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
      // Debug: Log the error structure to understand what we're dealing with
      console.log('Create folder error:', e);
      console.log('Error response:', e?.response);
      console.log('Error message:', e?.message);
      
      // Parse error message to show user-friendly text
      let errorMessage = 'Failed to create folder';
      
      // Check if it's an axios error with response data
      if (e?.response?.data?.message) {
        const apiMessage = e.response.data.message;
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
      else if (e?.response?.status) {
        const status = e.response.status;
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
      else if ((e as Error)?.message) {
        const msg = String((e as Error).message || '');
        if (msg.includes('Request failed with status code 500')) {
          errorMessage = 'Server error occurred. Please try again.';
        } else if (msg.includes('Request failed with status code 400')) {
          errorMessage = 'Invalid folder name. Please check your input.';
        } else if (msg.includes('Request failed with status code 409')) {
          errorMessage = 'A folder with this name already exists in this location';
        } else if (msg.includes('Request failed with status code')) {
          errorMessage = 'Failed to create folder. Please try again.';
        } else if (msg.includes('More than one matching record found')) {
          errorMessage = 'A folder with this name already exists in this location';
        } else if (msg.includes('Folder.findOne()')) {
          errorMessage = 'A folder with this name already exists';
        } else if (msg.includes('duplicate') || msg.includes('already exists')) {
          errorMessage = 'A folder with this name already exists in this location';
        } else {
          errorMessage = msg;
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
      setDescription('');
      setAllowAllBrands(false);
      setSelectedBrands([]);
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
      size="medium"
    >
      <form onSubmit={handleSubmit} className={styles.content}>
        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Folder Name *</label>
            <CarterInput
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Enter folder name"
              labelProps={{ label: ' ' }}
              error={!!error}
              disabled={isCreating}
              autoFocus
              required
            />
          </div>
          
          <div className={styles.field}>
            <label className={styles.label}>Description (Optional)</label>
            <CarterInput
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter folder description"
              labelProps={{ label: ' ' }}
              disabled={isCreating}
            />
          </div>
          
          <div className={styles.field}>
            <label className={styles.label}>Brand Access *</label>
            <CarterRadioGroup
              value={allowAllBrands ? 'true' : 'false'}
              onValueChange={(newValue: string) => {
                const next = newValue === 'true';
                setAllowAllBrands(next);
                if (next) setSelectedBrands([]);
              }}
              options={[
                { label: 'Allow all brands', value: 'true' },
                { label: 'Allow Specific Brands', value: 'false' },
              ]}
              radioFirst={true}
              textProps={{ fontSize: '14px', fontWeight: '500', color: '#1F2B33' }}
            />
          </div>
          
          {!allowAllBrands && (
            <div className={styles.field}>
              <label className={styles.label}>Brands *</label>
              <TabularAutocomplete
                inputProps={{ placeholder: 'Search Brands' }}
                showHeader={false}
                handleSearch={() => {}}
                onScroll={() => {}}
                labelKey="name"
                selectedOptions={(Array.isArray(brands) ? (brands as Brand[]) : []).filter(b => selectedBrands.includes(b.id))}
                enableRowSelection
                loading={brandsLoading}
                onSelectionChange={(selected: Brand[]) => {
                  setSelectedBrands(selected.map(b => b.id));
                }}
                hasNextPage={false}
                options={(Array.isArray(brands) ? (brands as Brand[]) : [])}
                columns={brandColumns}
                testId="create-folder-search-brands-input"
              />
            </div>
          )}
          
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}
        </div>

        <div className={styles.footer}>
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
