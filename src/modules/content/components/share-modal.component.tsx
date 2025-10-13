import React, { useState, useEffect } from 'react';
import { Button, TabularAutocomplete, CarterRadioGroup } from 'shyftlabs-dsl';
import { contentService } from '@/services/content/content.service';
import { Dialog } from './dialog.component';
import { Share2 as ShareIcon, Users as UsersIcon, Globe as GlobeIcon } from 'lucide-react';
import styles from '../styles/share-modal.module.scss';
import { useBrands } from '@/hooks/useBrands.hook';
import useAlert from '@/contexts/alert/alert.hook';
import { AlertVariant } from '@/contexts/alert/alert.provider';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileId: number | null;
  fileName?: string;
  isFolder?: boolean;
}

interface BrandAccess {
  brandId: number;
  brandName: string;
}

interface FileBrandAccess {
  id: number;
  name: string;
  allowAllBrands: boolean;
  brandAccess: BrandAccess[];
}

export const ShareModal: React.FC<ShareModalProps> = ({ 
  isOpen, 
  onClose, 
  fileId, 
  fileName = 'File',
  isFolder = false
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brandAccess, setBrandAccess] = useState<FileBrandAccess | null>(null);
  const [requestToken, setRequestToken] = useState(0);
  const [saving, setSaving] = useState(false);
  const [allowAll, setAllowAll] = useState<boolean>(false);
  const [selectedBrands, setSelectedBrands] = useState<number[]>([]);

  const { brands, loading: brandsLoading, error: brandsError } = useBrands();
  const { showAlert } = useAlert();
  const brandColumns = [
    {
      accessorKey: 'name',
      header: 'Brand Name',
      cell: ({ row }: { row: { original: { id: number; name: string } } }) => row.original.name || String(row.original.id),
    },
  ];

  const loadBrandAccess = React.useCallback(async (): Promise<void> => {
    if (!fileId) return;

    const currentToken = requestToken + 1;
    setRequestToken(currentToken);
    setLoading(true);
    setError(null);

    try {
      const response = isFolder
        ? await contentService.getFolderBrandAccess(fileId)
        : await contentService.getFileBrandAccess(fileId);
      // Ignore if a newer request started or modal was closed
      if (currentToken !== requestToken + 1) return;
      setBrandAccess(response.data);
      // Initialize controls from loaded data
      setAllowAll(!!response.data.allowAllBrands);
      setSelectedBrands(Array.isArray(response.data.brandAccess) ? response.data.brandAccess.map(b => b.brandId) : []);
    } catch (err: unknown) {
      const e = (err ?? {}) as { response?: { data?: { message?: string } }; message?: string };
      if (currentToken !== requestToken + 1) return;
      const msg = e?.response?.data?.message || e?.message || 'Failed to load brand access information';
      setError(msg);
      try { showAlert(msg, AlertVariant.ERROR); } catch {}
    } finally {
      if (currentToken === requestToken + 1) setLoading(false);
    }
  }, [fileId,isFolder]);

  useEffect(() => {
    if (isOpen && fileId) {
      void loadBrandAccess();
    }
  }, [isOpen, fileId, loadBrandAccess]);

  const handleClose = () => {
    setBrandAccess(null);
    setError(null);
    setSelectedBrands([]);
    setAllowAll(false);
    onClose();
  };

  const toggleBrand = (brandId: number, checked: boolean) => {
    setSelectedBrands(prev => {
      if (checked) return prev.includes(brandId) ? prev : [...prev, brandId];
      return prev.filter(id => id !== brandId);
    });
  };

  const handleSave = async () => {
    if (!fileId || isFolder) return; // Only updating files per requirement
    setSaving(true);
    setError(null);
    try {
      const payload: { allowAllBrands: boolean; selectedBrands: number[] } = {
        allowAllBrands: !!allowAll,
        selectedBrands: allowAll ? [] : selectedBrands,
      };
      await contentService.updateFile(Number(fileId), payload);
      try { showAlert('Brand access updated successfully', AlertVariant.SUCCESS); } catch {}
      handleClose();
    } catch (e: unknown) {
      const err = (e ?? {}) as { response?: { data?: { message?: string } } ; message?: string };
      const msg = err?.response?.data?.message || err?.message || 'Failed to update brand access';
      setError(msg);
      try { showAlert(msg, AlertVariant.ERROR); } catch {}
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} title={`Share ${isFolder ? 'Folder' : 'File'}: ${fileName}`} size="medium">
      <div className={styles.container}>
        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}
        
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>Loading brand access information...</p>
          </div>
        ) : brandAccess ? (
          <div className={styles.content}>
            {/* File Info */}
            <div className={styles.fileInfo}>
              <div className={styles.fileIcon}>
                <ShareIcon size={24} color="#12287c" />
              </div>
              <div className={styles.fileDetails}>
                <h3 className={styles.fileName}>{brandAccess.name}</h3>
                <p className={styles.fileId}>ID: {brandAccess.id}</p>
              </div>
            </div>

            {/* Access Control */}
            <div className={styles.accessControl}>
              <div className={styles.accessHeader}>
                <h4>Access Control</h4>
              </div>
              
              {/* Radio buttons for access control */}
              <div style={{ marginBottom: 16 }}>
                <CarterRadioGroup
                  value={allowAll ? 'true' : 'false'}
                  onValueChange={(value) => {
                    setAllowAll(value === 'true');
                    if (value === 'true') {
                      setSelectedBrands([]);
                    }
                  }}
                  options={[
                    { label: 'Allow all brands', value: 'true' },
                    { label: 'Choose specific brands', value: 'false' },
                  ]}
                  radioFirst={true}
                  disabled={saving}
                  textProps={{ fontSize: '14px', fontWeight: '500', color: '#1F2B33' }}
                />
              </div>
              
              {/* Editor controls */}
              <div className={allowAll ? styles.allBrandsAccess : styles.specificBrandsAccess}>
                <div className={styles.accessType}>
                  {allowAll ? (
                    <GlobeIcon size={20} color="#10b981" />
                  ) : (
                    <UsersIcon size={20} color="#3b82f6" />
                  )}
                  <span>{allowAll ? 'All Brands' : 'Specific Brands'}</span>
                </div>

                {!allowAll && (
                  <>
                    <p className={styles.accessDescription}>
                      Choose which brands can access this {isFolder ? 'folder' : 'file'}.
                    </p>
                    {brandsError && (
                      <div className={styles.error}>{brandsError}</div>
                    )}
                    <div>
                      <TabularAutocomplete
                        inputProps={{
                          placeholder: 'Search brands…',
                          disabled: saving,
                        }}
                        showHeader={false}
                        handleSearch={() => {}}
                        onScroll={() => {}}
                        labelKey="name"
                        enableRowSelection
                        loading={brandsLoading}
                        options={(brands || []) as Array<{ id: number; name: string }>}
                        columns={brandColumns as Array<{ accessorKey: string; header: string; cell: (args: { row: { original: { id: number; name: string } } }) => string }>}
                        selectedOptions={(brands || []).filter(b => selectedBrands.includes(b.id)) as Array<{ id: number; name: string }>}
                        onSelectionChange={(selected: Array<{ id: number; name: string }>) => {
                          setSelectedBrands(selected.map(s => s.id));
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className={styles.actions}>
              <Button 
                label="Close" 
                variant="secondary" 
                onClick={handleClose}
                disabled={saving}
              />
              {!isFolder && (
                <Button 
                  label={saving ? 'Saving…' : 'Save'}
                  variant="primary"
                  onClick={handleSave}
                  disabled={saving || ( !allowAll && selectedBrands.length === 0 )}
                />
              )}
            </div>
          </div>
        ) : (
          <div className={styles.noData}>
            <p>No brand access information available.</p>
          </div>
        )}
      </div>
    </Dialog>
  );
};

export default ShareModal;
