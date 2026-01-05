import { useEffect, useMemo, useState } from 'react';
import React from 'react';
import { contentService } from '@/services/content/content.service';
import type { File as LibraryFile, Folder, BreadcrumbItem } from '@/types/folder';
import contentItemStyles from '@/modules/content/styles/folder-item.module.scss';
import { Folder as FolderIcon, Plug2 } from 'lucide-react';
import { getFileIcon } from '@/utils/file-icons';
import { RMNInput } from '@/components/input';
import { Button } from 'shyftlabs-dsl';
import styles from './media-library.module.scss';

const isVideo = (contentType: string | undefined) => typeof contentType === 'string' && contentType.startsWith('video/');
const isImage = (contentType: string | undefined) => typeof contentType === 'string' && contentType.startsWith('image/');

export type MediaLibraryTypeFilter = 'image' | 'video' | 'website' | 'integration';

export type MediaLibraryProps = {
  title?: string;
  onItemSelect: (file: LibraryFile) => void;
  onWebsiteAdd?: (name: string, url: string) => void;
  onIntegrationAdd?: () => void;
  integrationSelector?: React.ReactNode;
  showWebsiteForm?: boolean;
  showIntegrationSelector?: boolean;
  typeFilter?: MediaLibraryTypeFilter;
  onTypeFilterChange?: (filter: MediaLibraryTypeFilter) => void;
  imageCount?: number;
  videoCount?: number;
  websiteCount?: number;
  integrationCount?: number;
}

const MediaLibrary: React.FC<MediaLibraryProps> = ({
  title = 'Media Library',
  onItemSelect,
  onWebsiteAdd,
  onIntegrationAdd,
  integrationSelector,
  showWebsiteForm = true,
  showIntegrationSelector = true,
  typeFilter: controlledTypeFilter,
  onTypeFilterChange,
  imageCount: externalImageCount,
  videoCount: externalVideoCount,
  websiteCount: externalWebsiteCount,
  integrationCount: externalIntegrationCount,
}) => {
  const [library, setLibrary] = useState<LibraryFile[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [breadcrumbHistory, setBreadcrumbHistory] = useState<Folder[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { id: null, name: 'Root', path: '' }
  ]);
  const [previewMap, setPreviewMap] = useState<Record<string | number, string>>({});
  const [thumbnailMap, setThumbnailMap] = useState<Record<string | number, string>>({});
  const [search, setSearch] = useState('');
  const [internalTypeFilter, setInternalTypeFilter] = useState<MediaLibraryTypeFilter>('image');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [websiteName, setWebsiteName] = useState('');

  const typeFilter = controlledTypeFilter ?? internalTypeFilter;
  const setTypeFilter = onTypeFilterChange ?? setInternalTypeFilter;

  // Load folders and files
  useEffect(() => {
    let active = true;
    const parentId = currentFolder ? Number(currentFolder.id) : null;
    Promise.all([
      contentService.getFolders(parentId),
      contentService.getFiles(parentId)
    ])
      .then(([foldersRes, filesRes]) => {
        if (!active) return;
        setFolders(foldersRes.data || []);
        setLibrary(filesRes.data || []);
      })
      .catch(() => {
        if (!active) return;
        setFolders([]);
        setLibrary([]);
      });
    return () => { active = false; };
  }, [currentFolder]);

  // Load file URLs and thumbnails
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const entries = await Promise.all(library.map(async (f) => {
        try {
          // Use fileUrl directly if available (GCP URL)
          let fileUrl = f.fileUrl;
          
          // Only fetch signed URL if fileUrl is not available
          if (!fileUrl) {
            fileUrl = await contentService.getFileUrl(f);
          }
          
          if (isVideo(f.content_type)) {
            try {
              const thumbnailUrl = await generateVideoThumbnail(fileUrl);
              return [f.id, fileUrl, thumbnailUrl] as const;
            } catch {
              return [f.id, fileUrl, fileUrl] as const;
            }
          }
          return [f.id, fileUrl] as const;
        } catch (error) {
          console.error('Failed to load file URL for', f.id, error);
          const fallbackUrl = f.fileUrl || contentService.getFileUrlSync(f);
          return [f.id, fallbackUrl] as const;
        }
      }));
      if (!cancelled) {
        const map: Record<string | number, string> = {};
        const thumbMap: Record<string | number, string> = {};
        entries.forEach((entry) => { 
          if (entry.length === 3) {
            const [id, url, thumb] = entry;
            map[id] = url;
            thumbMap[id] = thumb;
          } else {
            const [id, url] = entry;
            map[id] = url;
            thumbMap[id] = url;
          }
        });
        setPreviewMap(map);
        setThumbnailMap(thumbMap);
      }
    };
    if (library.length > 0) {
      run();
    } else {
      setPreviewMap({});
      setThumbnailMap({});
    }
    return () => { cancelled = true; };
  }, [library]);

  const generateVideoThumbnail = async (videoUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      
      video.crossOrigin = 'anonymous';
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        video.currentTime = 0.1;
      };
      
      video.onseeked = () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(thumbnailUrl);
      };
      
      video.onerror = () => reject(new Error('Video load failed'));
      video.src = videoUrl;
    });
  };

  const updateBreadcrumbs = (folder: Folder | null, history: Folder[] = []) => {
    if (!folder) {
      setBreadcrumbs([{ id: null, name: 'Root', path: '' }]);
      setBreadcrumbHistory([]);
      return;
    }
    const items: BreadcrumbItem[] = [{ id: null, name: 'Root', path: '' }];
    history.forEach((parent) => {
      items.push({ id: Number(parent.id), name: parent.name, path: `/folder/${parent.id}` });
    });
    items.push({ id: Number(folder.id), name: folder.name, path: `/folder/${folder.id}` });
    setBreadcrumbs(items);
    setBreadcrumbHistory(history);
  };

  const navigateToFolder = (folder: Folder) => {
    const newHistory = [...breadcrumbHistory, ...(currentFolder ? [currentFolder] : [])];
    setCurrentFolder(folder);
    updateBreadcrumbs(folder, newHistory);
  };

  const navigateToCrumb = (crumb: BreadcrumbItem, index: number) => {
    if (crumb.id === null) {
      setCurrentFolder(null);
      updateBreadcrumbs(null, []);
      return;
    }
    const newHistory = breadcrumbHistory.slice(0, index);
    const targetFolder = index < breadcrumbHistory.length ? breadcrumbHistory[index] : currentFolder;
    if (targetFolder && Number(targetFolder.id) === Number(crumb.id)) {
      setCurrentFolder(targetFolder);
      updateBreadcrumbs(targetFolder, newHistory);
    } else {
      const f: Folder = { id: Number(crumb.id), name: crumb.name, parent_id: null, account_id: 0, owner_id: 0, allow_all_brands: true } as unknown as Folder;
      setCurrentFolder(f);
      updateBreadcrumbs(f, newHistory);
    }
  };

  const libraryMapped = useMemo(() => library.map(f => ({ 
    file: f, 
    previewUrl: previewMap[f.id],
    thumbnailUrl: thumbnailMap[f.id] || previewMap[f.id]
  })), [library, previewMap, thumbnailMap]);

  const filteredLibrary = useMemo(() => {
    const q = search.trim().toLowerCase();
    return libraryMapped.filter(({ file }) => {
      const matchesType = typeFilter === 'image' ? isImage(file.content_type) : 
                         typeFilter === 'video' ? isVideo(file.content_type) : false;
      const name = (file.original_filename || file.name || '').toLowerCase();
      const matchesQuery = q.length === 0 || name.includes(q);
      return matchesType && matchesQuery;
    });
  }, [libraryMapped, search, typeFilter]);

  const internalImageCount = useMemo(() => library.filter(f => isImage(f.content_type)).length, [library]);
  const internalVideoCount = useMemo(() => library.filter(f => isVideo(f.content_type)).length, [library]);
  
  const imageCount = externalImageCount !== undefined ? externalImageCount : internalImageCount;
  const videoCount = externalVideoCount !== undefined ? externalVideoCount : internalVideoCount;
  const websiteCount = externalWebsiteCount ?? 0;
  const integrationCount = externalIntegrationCount ?? 0;

  const isValidUrl = (url: string): boolean => {
    if (!url.trim()) return true;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleAddWebsite = () => {
    if (!websiteUrl.trim() || !isValidUrl(websiteUrl)) {
      return;
    }
    if (onWebsiteAdd) {
      onWebsiteAdd(websiteName.trim() || 'Website', websiteUrl.trim());
    }
    setWebsiteUrl('');
    setWebsiteName('');
  };

  return (
    <div className={styles.mediaLibrarySection}>
      <div className={styles.header}>
        <h3 className={styles.headerTitle}>{title}</h3>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={`${crumb.id ?? 'root'}-${idx}`}>
              <a
                className={styles.breadcrumbLink}
                onClick={() => navigateToCrumb(crumb, idx)}
              >
                {crumb.name}
              </a>
              {idx < breadcrumbs.length - 1 && <span style={{ color: '#9ca3af', fontSize: 12 }}>/</span>}
            </React.Fragment>
          ))}
        </div>
        <div className={styles.filtersRow}>
          <div className={styles.typeChips}>
            <button className={`${styles.chip} ${typeFilter === 'image' ? styles.active : ''}`} onClick={() => setTypeFilter('image')}>
              Images ({imageCount})
            </button>
            <button className={`${styles.chip} ${typeFilter === 'video' ? styles.active : ''}`} onClick={() => setTypeFilter('video')}>
              Videos ({videoCount})
            </button>
            {showWebsiteForm && (
              <button className={`${styles.chip} ${typeFilter === 'website' ? styles.active : ''}`} onClick={() => setTypeFilter('website')}>
                Websites ({websiteCount})
              </button>
            )}
            {showIntegrationSelector && (
              <button className={`${styles.chip} ${typeFilter === 'integration' ? styles.active : ''}`} onClick={() => setTypeFilter('integration')}>
                <Plug2 size={14} style={{ marginRight: '4px', display: 'inline-block', verticalAlign: 'middle' }} />
                Integrations ({integrationCount})
              </button>
            )}
          </div>
          {typeFilter !== 'integration' && (
            <input 
              className={styles.searchInput} 
              placeholder="Search media..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          )}
        </div>
      </div>
      <div className={`${styles.libraryGrid} ${contentItemStyles.grid}`}>
        {typeFilter === 'integration' && showIntegrationSelector ? (
          integrationSelector || <div className={styles.emptyLibrary}>Integration selector not provided</div>
        ) : typeFilter === 'website' && showWebsiteForm ? (
          <div className={styles.websiteForm}>
            <div className={styles.websiteInputGroup}>
              <label className={styles.websiteLabel}>Website Name</label>
              <RMNInput
                placeholder="Enter website name"
                size="small"
                value={websiteName}
                onChange={(e) => setWebsiteName((e.target as HTMLInputElement).value)}
              />
            </div>
            <div className={styles.websiteInputGroup}>
              <label className={styles.websiteLabel}>Website URL *</label>
              <RMNInput
                placeholder="https://example.com"
                size="small"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl((e.target as HTMLInputElement).value)}
              />
            </div>
            <Button
              label="Add Website"
              onClick={handleAddWebsite}
              disabled={!websiteUrl.trim() || !isValidUrl(websiteUrl)}
              size="small"
              style={{ marginTop: '12px' }}
            />
          </div>
        ) : (
          <>
            {folders.map((folder) => (
              <div key={`folder-${folder.id}`} className={contentItemStyles.item} onClick={() => navigateToFolder(folder)} role="button" tabIndex={0}>
                <div className={contentItemStyles.itemContent + ' ' + contentItemStyles.folderCard}>
                  <FolderIcon size={72} color="#12287c" />
                  <div className={contentItemStyles.name}>{folder.name}</div>
                </div>
              </div>
            ))}
            {filteredLibrary.map(({ file, thumbnailUrl }) => (
              <div key={file.id} className={contentItemStyles.item} onClick={() => onItemSelect(file)} role="button" tabIndex={0}>
                <div className={contentItemStyles.itemContent + ' ' + contentItemStyles.folderCard}>
                  {isImage(file.content_type) ? (
                    <img className={contentItemStyles.fileThumb} src={thumbnailUrl} alt={file.original_filename || file.name} />
                  ) : (
                    <span className={contentItemStyles.fileIcon}>{getFileIcon(file.content_type, file.original_filename)}</span>
                  )}
                  <div className={contentItemStyles.name}>{file.original_filename || file.name}</div>
                </div>
              </div>
            ))}
            {filteredLibrary.length === 0 && folders.length === 0 && (
              <div className={styles.emptyLibrary}>No media found. Try adjusting filters or uploading in Content.</div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MediaLibrary;

