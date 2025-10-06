import React from 'react';
import { Button } from 'shyftlabs-dsl';
import { File, Brand } from '@/types/folder';
import { contentService } from '@/services/content/content.service';
import { useBrands } from '@/hooks/useBrands.hook';
import { Dialog } from './dialog.component';

interface FileDetailsDialogProps {
  isOpen: boolean;
  fileId: number | string | null;
  onClose: () => void;
  onUpdated?: (file: File) => void;
}

export const FileDetailsDialog: React.FC<FileDetailsDialogProps> = ({ isOpen, fileId, onClose, onUpdated }) => {
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [file, setFile] = React.useState<File | null>(null);

  // Editable fields
  const [allowAllBrands, setAllowAllBrands] = React.useState(false);
  const [selectedBrands, setSelectedBrands] = React.useState<number[]>([]);
  const [status, setStatus] = React.useState<string>('active');
  const [description, setDescription] = React.useState<string>('');
  const [metadataText, setMetadataText] = React.useState<string>('');

  const { brands } = useBrands();

  const load = React.useCallback(async () => {
    if (!fileId && fileId !== 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await contentService.getFileById(Number(fileId));
      const f = res.data;
      setFile(f);
      setAllowAllBrands(!!f.allow_all_brands);
      setSelectedBrands(Array.isArray(f.brandAccess) ? (f.brandAccess as number[]) : []);
      setStatus(f.status || 'active');
      setDescription(f.description || '');
      setMetadataText(JSON.stringify(f.metadata || {}, null, 2));
    } catch (e) {
      const message = (e as { response?: { data?: { message?: string } } ; message?: string })?.response?.data?.message
        || (e as { message?: string }).message
        || 'Failed to load file';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [fileId]);

  React.useEffect(() => {
    if (isOpen) {
      load();
    }
  }, [isOpen, load]);

  const handleSave = async () => {
    if (!file) return;
    setSaving(true);
    setError(null);
    try {
      // Parse metadata JSON (optional)
      let metadataObj: Record<string, unknown> | undefined = undefined;
      if (metadataText.trim()) {
        try {
          metadataObj = JSON.parse(metadataText);
        } catch {
          setError('Metadata must be valid JSON');
          setSaving(false);
          return;
        }
      }

      const payload: Partial<{ status: string; description?: string; metadata?: Record<string, unknown>; allowAllBrands: boolean; selectedBrands: number[] }> = {
        status,
        description: description || undefined,
        metadata: metadataObj,
      };
      // Only include brand controls if explicitly set; API allows any subset
      if (allowAllBrands) {
        payload.allowAllBrands = true;
        payload.selectedBrands = [] as number[];
      } else {
        payload.allowAllBrands = false;
        payload.selectedBrands = selectedBrands;
      }

      const res = await contentService.updateFile(Number(file.id), payload);
      setFile(res.data);
      if (onUpdated) onUpdated(res.data);
    } catch (e) {
      const message = (e as { response?: { data?: { message?: string } } ; message?: string })?.response?.data?.message
        || (e as { message?: string }).message
        || 'Failed to update file';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    if (!file) return;
    try {
      await contentService.downloadFile(file.id, file.original_filename);
    } catch {
      // ignore
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={file ? file.original_filename : 'File'} size="medium">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && (
          <div style={{ color: '#b00020' }}>{error}</div>
        )}
        {loading ? (
          <div>Loading...</div>
        ) : file ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 12 }}>
              <div>Filename</div>
              <div>{file.original_filename}</div>
              <div>Size</div>
              <div>{contentService.formatFileSize(file.file_size)}</div>
              <div>Type</div>
              <div>{file.content_type}</div>
              <div>Folder</div>
              <div>{file.folder_id ?? 'Root'}</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Button label="Download" variant="secondary" onClick={handleDownload} />
            </div>

            <hr />

            <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 12 }}>
              <div>Status</div>
              <select value={status} onChange={(e) => setStatus(e.target.value)} disabled={saving}>
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </select>

              <div>Description</div>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} disabled={saving} />

              <div>Allow All Brands</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={allowAllBrands}
                  onChange={(e) => setAllowAllBrands(e.target.checked)}
                  disabled={saving}
                />
                Allow all brands to access this file
              </label>

              {!allowAllBrands && (
                <>
                  <div>Select Brands</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {Array.isArray(brands) && brands.length > 0 ? (
                      (brands as Brand[]).map((b) => (
                        <label key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input
                            type="checkbox"
                            checked={selectedBrands.includes(b.id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedBrands((prev) => [...prev, b.id]);
                              else setSelectedBrands((prev) => prev.filter((id) => id !== b.id));
                            }}
                            disabled={saving}
                          />
                          <span>{b.name}</span>
                        </label>
                      ))
                    ) : (
                      <span>No brands available</span>
                    )}
                  </div>
                </>
              )}

              <div>Metadata (JSON)</div>
              <textarea
                rows={6}
                value={metadataText}
                onChange={(e) => setMetadataText(e.target.value)}
                spellCheck={false}
                disabled={saving}
                style={{ fontFamily: 'monospace' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <Button label="Close" variant="secondary" onClick={onClose} disabled={saving} />
              <Button label={saving ? 'Saving…' : 'Save Changes'} variant="primary" onClick={handleSave} disabled={saving} />
            </div>
          </>
        ) : (
          <div>No file selected</div>
        )}
      </div>
    </Dialog>
  );
};

export default FileDetailsDialog;


