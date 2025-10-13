import React from 'react';
import { useRouter } from 'next/router';
import InternalLayout from '@/layouts/internal-layout/internal-layout';
import PageHeader from '@/components/page-header/page-header.component';
import { Button as CarterButton, CarterInput, CarterRadioGroup, CarterSelect, TabularAutocomplete } from 'shyftlabs-dsl';
import { contentService } from '@/services/content/content.service';
import { File, Brand } from '@/types/folder';
import { useBrands } from '@/hooks/useBrands.hook';
import styles from '../styles/file-form.module.scss';


const FileForm: React.FC & { getLayout?: (page: React.ReactNode) => React.ReactNode } = () => {
  const router = useRouter();
  const idParam = router.query.id as string | undefined;
  const fileId = idParam ? Number(idParam) : undefined;

  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [file, setFile] = React.useState<File | null>(null);

  // editable fields
  const [allowAllBrands, setAllowAllBrands] = React.useState(false);
  const [selectedBrands, setSelectedBrands] = React.useState<number[]>([]);
  const [status, setStatus] = React.useState<string>('active');
  const [description, setDescription] = React.useState<string>('');
  // no metadata editing in UI per requirement
  const [previewUrl, setPreviewUrl] = React.useState<string>('');

  const { brands } = useBrands();

  const brandColumns = [
    {
      accessorKey: 'name',
      header: 'Brand Name',
      cell: ({ row }: { row: { original: Brand } }) => row.original.name || String(row.original.id),
    },
  ];

  const load = React.useCallback(async () => {
    if (!fileId && fileId !== 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await contentService.getFileById(Number(fileId));
      type ApiFile = Partial<{
        id: number | string;
        name: string;
        originalFilename: string;
        original_filename: string;
        folderId: number | string | null;
        folder_id: number | string | null;
        folderName: string;
        folder_name: string;
        accountId: number | string;
        account_id: number | string;
        ownerId: number | string;
        owner_id: number | string;
        storage_key: string;
        storageKey: string;
        fileSize: number | string;
        file_size: number | string;
        contentType: string;
        content_type: string;
        allowAllBrands: boolean;
        allow_all_brands: boolean;
        status: string;
        description: string;
        brandAccess: number[];
        metadata: Record<string, unknown>;
        uploadedAt: string;
        fileUrl: string;
        file_url: string;
        createdAt: string;
        created_at: string;
        updatedAt: string;
        updated_at: string;
      }>;
      const f = res.data as ApiFile;
      const normalized: File = {
        id: f.id,
        name: f.name ?? f.originalFilename ?? f.original_filename ?? '',
        original_filename: f.originalFilename ?? f.original_filename ?? f.name ?? '',
        folder_id: (f.folderId ?? f.folder_id ?? null) as number | null,
        folderName: f.folderName ?? f.folder_name ?? '',
        account_id: f.accountId ?? f.account_id ?? '',
        owner_id: f.ownerId ?? f.owner_id ?? '',
        storage_key: f.storage_key ?? f.storageKey ?? '',
        file_size: f.fileSize ?? f.file_size ?? 0,
        content_type: f.contentType ?? f.content_type ?? '',
        allow_all_brands: Boolean(f.allowAllBrands ?? f.allow_all_brands ?? false),
        status: f.status,
        description: f.description,
        brandAccess: Array.isArray(f.brandAccess) ? f.brandAccess : [],
        metadata: (f.metadata as Record<string, unknown>) ?? { originalName: f.originalFilename ?? '', uploadedAt: f.uploadedAt ?? '', storageProvider: ((f.metadata as Record<string, unknown> | undefined)?.storageProvider ?? 'local') },
        fileUrl: f.fileUrl ?? f.file_url,
        createdAt: f.createdAt ?? f.created_at,
        updatedAt: f.updatedAt ?? f.updated_at,
      } as unknown as File;

      setFile(normalized);
      setAllowAllBrands(Boolean(normalized.allow_all_brands));
      setSelectedBrands(Array.isArray(normalized.brandAccess) ? (normalized.brandAccess as number[]) : []);
      setStatus(normalized.status || 'active');
      setDescription(normalized.description || '');
      // no metadata UI
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
    load();
  }, [load]);

  // Load preview URL for images and videos
  React.useEffect(() => {
    if (!file) return;
    const isImage = String(file.content_type || '').startsWith('image/');
    const isVideo = String(file.content_type || '').startsWith('video/');
    
    if (!isImage && !isVideo) {
      setPreviewUrl('');
      return;
    }
    // Use direct GCP URL
    const url = contentService.getFileUrl(file);
    setPreviewUrl(url);
  }, [file?.id, file?.content_type]);

  const handleSave = async () => {
    if (!file) return;
    setSaving(true);
    setError(null);
    try {
      const payload: Partial<{ status: string; description?: string; allowAllBrands: boolean; selectedBrands: number[] }> = {
        status,
        description: description || undefined,
      };
      if (allowAllBrands) {
        payload.allowAllBrands = true;
        payload.selectedBrands = [] as number[];
      } else {
        payload.allowAllBrands = false;
        payload.selectedBrands = selectedBrands;
      }
      await contentService.updateFile(Number(file.id), payload);
      await load();
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
    await contentService.downloadFile(file.id, file.original_filename);
  };

  return (
    <>
      <PageHeader
        title={file ? file.original_filename : 'File'}
        ActionComponent={() => (
          <div style={{ display: 'flex', gap: 8 }}>
            <CarterButton label="Back" variant="text-only" size="small" onClick={() => router.back()} />
            <CarterButton label="Download" variant="secondary" size="small" onClick={handleDownload} />
            <CarterButton label={saving ? 'Saving…' : 'Save Changes'} variant="primary" size="small" onClick={handleSave} disabled={saving} />
          </div>
        )}
      />
      <div className={styles.container}>
        {error && <div className={styles.error}>{error}</div>}
        {loading || !file ? (
          <div>Loading…</div>
        ) : (
          <>
          <div className={styles.flexTwoCol}>
            <div className={styles.input_wrapper}>
              <p className={styles.title}> File details </p>
              <div className={styles.flexTwoCol}>
                <div className={`${styles.card} ${styles.col}`}>
                  <div>
                  {file && previewUrl ? (
                    String(file.content_type || '').startsWith('image/') ? (
                      <img className={styles.previewImage} src={previewUrl} alt={file.original_filename} />
                    ) : String(file.content_type || '').startsWith('video/') ? (
                      <video 
                        className={styles.previewVideo}
                        src={previewUrl}
                        controls
                        style={{ 
                          width: '100%', 
                          maxHeight: '400px', 
                          objectFit: 'contain',
                          backgroundColor: '#000',
                          borderRadius: '8px'
                        }}
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <div style={{ color: '#6c757d' }}>No preview available</div>
                    )
                  ) : (
                    <div style={{ color: '#6c757d' }}>No preview available</div>
                  )}
                  </div>
                  <div className={styles.previewDetails}>
                    <div className={styles.detailsList}>
                      <div className={styles.detailsRow}>
                        <div className={styles.detailLabel}>Filename</div>
                        <div className={`${styles.detailValue} ${styles.mono}`}>{file.original_filename}</div>
                      </div>
                      <div className={styles.detailsRow}>
                        <div className={styles.detailLabel}>Size</div>
                        <div className={styles.detailValue}>{contentService.formatFileSize(file.file_size)}</div>
                      </div>
                      <div className={styles.detailsRow}>
                        <div className={styles.detailLabel}>Type</div>
                        <div className={styles.detailValue}>{file.content_type}</div>
                      </div>
                      <div className={styles.detailsRow}>
                        <div className={styles.detailLabel}>Folder</div>
                        <div className={styles.detailValue}>{file.folderName?? 'Root'}</div>
                      </div>
                    </div>
                  </div>
                </div>
               
              </div>
            </div>

            <div className={`${styles.input_wrapper} ${styles.col}`}>
              <p className={styles.title}> Access </p>
              <div className={styles.section}>
                <div className={styles.input_container}>
                  <span className={styles.input_label}>Brand Access *</span>
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
                  <div className={styles.input_container}>
                    <span className={styles.input_label}>Brands *</span>
                    <TabularAutocomplete
                      inputProps={{ placeholder: 'Search Brands' }}
                      showHeader={false}
                      handleSearch={() => {}}
                      onScroll={() => {}}
                      labelKey="name"
                      selectedOptions={(Array.isArray(brands) ? (brands as Brand[]) : []).filter(b => selectedBrands.includes(b.id))}
                      enableRowSelection
                      loading={false}
                      onSelectionChange={(selected: Brand[]) => {
                        setSelectedBrands(selected.map(b => b.id));
                      }}
                      hasNextPage={false}
                      options={(Array.isArray(brands) ? (brands as Brand[]) : [])}
                      columns={brandColumns}
                      testId="file-search-brands-input"
                    />
                  </div>
                )}
              </div>
              <div className={styles.section}>
                <p className={styles.title}> Status and Description </p>
                <div className={styles.grid}>
                  <div className={styles.input_container}>
                    <span className={styles.input_label}>Status</span>
                    <CarterSelect
                      options={[
                        { label: 'active', value: 'active' },
                        { label: 'inactive', value: 'inactive' },
                      ]}
                      label=" "
                      placeholder="Select status"
                      value={status}
                      id="file-status"
                      width="100%"
                      onChange={({ target }: { target: { value: string } }) => {
                        setStatus(target.value);
                      }}
                    />
                  </div>
                  <div className={styles.input_container}>
                    <span className={styles.input_label}>Description</span>
                    <CarterInput
                      id="file-description"
                      type="text"
                      labelProps={{ label: ' ' }}
                      value={description}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
            </div>

          </>
        )}
      </div>
    </>
  );
};

FileForm.getLayout = (page: React.ReactNode) => <InternalLayout>{page}</InternalLayout>;
export default FileForm;


