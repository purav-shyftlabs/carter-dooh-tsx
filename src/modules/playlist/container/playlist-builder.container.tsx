import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { RMNInput } from '@/components/input';
import { usePlaylistStore } from '@/contexts/playlist/playlist.store';
import type { PlaylistItem } from '@/types/playlist';
import styles from '../styles/playlist-builder.module.scss';
import TimelineItem from '../component/timeline-item.component';
import PreviewPlayer from '../component/preview-player.component';
import { contentService } from '@/services/content/content.service';
import type { File as LibraryFile, Folder, BreadcrumbItem } from '@/types/folder';
import React from 'react';
import InternalLayout from '@/layouts/internal-layout/internal-layout';
import { NextPageWithLayout } from '@/types/common';
import contentItemStyles from '@/modules/content/styles/folder-item.module.scss';
import { Folder as FolderIcon, EyeIcon, TrashIcon } from 'lucide-react';
import { getFileIcon } from '@/utils/file-icons';
import PageHeader from '@/components/page-header/page-header.component';
import { Button } from 'shyftlabs-dsl';

const isVideo = (contentType: string | undefined) => typeof contentType === 'string' && contentType.startsWith('video/');
const isImage = (contentType: string | undefined) => typeof contentType === 'string' && contentType.startsWith('image/');

const PlaylistBuilder: NextPageWithLayout = () => {
  const { playlist, reorder, addItem, setName } = usePlaylistStore();
  const [library, setLibrary] = useState<LibraryFile[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [breadcrumbHistory, setBreadcrumbHistory] = useState<Folder[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { id: null, name: 'Root', path: '' }
  ]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [previewMap, setPreviewMap] = useState<Record<string | number, string>>({});
  const [thumbnailMap, setThumbnailMap] = useState<Record<string | number, string>>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'image' | 'video'>('image');
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

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

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const entries = await Promise.all(library.map(async (f) => {
        try {
          // Use direct GCP URL from file.fileUrl
          const fileUrl = contentService.getFileUrl(f);
          // For videos, generate thumbnail from first frame
          if (isVideo(f.content_type)) {
            try {
              const thumbnailUrl = await generateVideoThumbnail(fileUrl);
              return [f.id, fileUrl, thumbnailUrl] as const;
            } catch {
              return [f.id, fileUrl, fileUrl] as const;
            }
          }
          return [f.id, fileUrl] as const;
        } catch {
          return [f.id, ''] as const;
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
        video.currentTime = 0.1; // Seek to first frame
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

  // Breadcrumb helpers
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
      const matchesType = typeFilter === 'image' ? isImage(file.content_type) : isVideo(file.content_type);
      const name = (file.original_filename || file.name || '').toLowerCase();
      const matchesQuery = q.length === 0 || name.includes(q);
      return matchesType && matchesQuery;
    });
  }, [libraryMapped, search, typeFilter]);

  const totalDuration = useMemo(() => playlist.items.reduce((acc, it) => acc + Math.max(1, Number(it.duration || 0)), 0), [playlist.items]);
  const formatSeconds = (s: number) => {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m > 0 ? `${m}m ${r}s` : `${r}s`;
  };

  const imageCount = useMemo(() => library.filter(f => isImage(f.content_type)).length, [library]);
  const videoCount = useMemo(() => library.filter(f => isVideo(f.content_type)).length, [library]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const normalizedItems = (playlist.items || []).map((it) => {
        const { id: _id, url: _url, thumbnailUrl: _thumb, assetId, ...rest } = it;
        const enabled = Boolean(rest.availability && (rest.availability as { enabled?: boolean }).enabled);
        return {
          ...rest,
          fileId: assetId,
          availability: enabled ? rest.availability : { enabled: false },
        };
      });
      const normalizedPlaylist = { ...playlist, items: normalizedItems };
      const payload = { name: playlist.name, description, playlist: normalizedPlaylist };
      const res = await (await import('@/services/content/playlist.service')).playlistRenderService.createPlaylist(payload as unknown as any);
      // TODO: toast success
    } catch (e) {
      // TODO: toast error
    } finally {
      setSubmitting(false);
    }
  };

  const Actions: React.FC = () => (
    <div style={{ display: 'flex', gap: 8 }}>
      <Button disabled={playlist.items.length === 0} onClick={() => window.confirm('Clear all items?') && usePlaylistStore.getState().clear()} label="Clear" icon={<TrashIcon size={10} />} iconPosition="left" variant="danger" />
      <Button disabled={playlist.items.length <= 1} onClick={() => setPreviewOpen(true)} label="Preview" icon={<EyeIcon size={10} />} iconPosition="left" variant="tertiary" />
      <Button disabled={submitting || !playlist.name || playlist.items.length <= 1} onClick={handleSubmit} label={submitting ? 'Saving...' : 'Create Playlist'} />
    </div>
  );

  const handleAddFromLibrary = (asset: LibraryFile) => {
    const url = previewMap[asset.id] || contentService.getFileUrl(asset);
    const thumbnailUrl = thumbnailMap[asset.id] || url;
    const newId = addItem({
      assetId: String(asset.id),
      type: isVideo(asset.content_type) ? 'video' : 'image',
      url,
      thumbnailUrl,
      name: asset.original_filename || asset.name,
    });

    // For videos: set duration from metadata when available
    if (isVideo(asset.content_type)) {
      const vid = document.createElement('video');
      vid.src = url;
      vid.preload = 'metadata';
      vid.onloadedmetadata = () => {
        const secs = Math.max(1, Math.round(vid.duration || 1));
        usePlaylistStore.getState().updateDuration(newId, secs);
      };
    }
  };

  const onDragStart = (e: DragStartEvent) => {
    setDraggingId(String(e.active.id));
  };

  const onDragEnd = (e: DragEndEvent) => {
    setDraggingId(null);
    const { active, over } = e;
    if (!over) return;
    const activeIndex = playlist.items.findIndex(i => i.id === active.id);
    const overIndex = playlist.items.findIndex(i => i.id === over.id);
    if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
      reorder(activeIndex, overIndex);
    }
  };

  return (
    <div className={styles.wrapper}>
      <PageHeader title="Add Playlist" ActionComponent={Actions} />
      <div className={styles.rightPane}>
        <div className={styles.detailsForm}>
          <div className={styles.formGrid}>
            <div className={styles.formCell}>
              <label className={styles.formLabel}>Name</label>
              <RMNInput
                className={styles.formEqual}
                placeholder="Playlist name"
                size="small"
                value={playlist.name}
                onChange={(e) => setName((e.target as HTMLInputElement).value)}
              />
            </div>
            <div className={styles.formCell}>
              <label className={styles.formLabel}>Description</label>
              <RMNInput
                className={styles.formEqual}
                placeholder="Describe this playlist"
                size="small"
                value={description}
                onChange={(e) => setDescription((e.target as HTMLInputElement).value)}
              />
            </div>
          </div>
        </div>
        
        <div className={styles.timeline} ref={timelineRef}>
          <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
            <SortableContext items={playlist.items.map(i => i.id)} strategy={horizontalListSortingStrategy}>
              <div className={styles.timelineList}>
                {playlist.items.length === 0 && (
                  <div className={styles.placeholder}>
                    <div className={styles.placeholderTitle}>Build your playlist</div>
                    <div className={styles.placeholderDesc}>Select media from the left and click to add here. Drag to reorder, edit durations inline.</div>
                  </div>
                )}
                {playlist.items.map((item: PlaylistItem, idx: number) => (
                  <TimelineItem key={item.id} item={item} index={idx} draggingId={draggingId} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>
      <div className={styles.leftPane}>
        <div className={styles.header}>
          <h3>Media Library</h3>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={`${crumb.id ?? 'root'}-${idx}`}>
                <button
                  className={styles.chip}
                  onClick={() => navigateToCrumb(crumb, idx)}
                >
                  {crumb.name}
                </button>
                {idx < breadcrumbs.length - 1 && <span style={{ color: '#9ca3af', fontSize: 12 }}>/</span>}
              </React.Fragment>
            ))}
          </div>
          <div className={styles.filtersRow}>
            <div className={styles.typeChips}>
              <button className={`${styles.chip} ${typeFilter === 'image' ? styles.active : ''}`} onClick={() => setTypeFilter('image')}>Images ({imageCount})</button>
              <button className={`${styles.chip} ${typeFilter === 'video' ? styles.active : ''}`} onClick={() => setTypeFilter('video')}>Videos ({videoCount})</button>
            </div>
            <input className={styles.searchInput} placeholder="Search media..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className={`${styles.libraryGrid} ${contentItemStyles.grid}`}>
          {folders.map((folder) => (
            <div key={`folder-${folder.id}`} className={contentItemStyles.item} onClick={() => navigateToFolder(folder)} role="button" tabIndex={0}>
              <div className={contentItemStyles.itemContent + ' ' + contentItemStyles.folderCard}>
                <FolderIcon size={72} color="#12287c" />
                <div className={contentItemStyles.name}>{folder.name}</div>
              </div>
            </div>
          ))}
          {filteredLibrary.map(({ file, thumbnailUrl }) => (
            <div key={file.id} className={contentItemStyles.item} onClick={() => handleAddFromLibrary(file)} role="button" tabIndex={0}>
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
        </div>
      </div>

      {previewOpen && (
        <PreviewPlayer onClose={() => setPreviewOpen(false)} />
      )}
    </div>
  );
};


PlaylistBuilder.getLayout = (page: React.ReactNode) => <InternalLayout head={{ title: 'Playlist Builder', description: 'Playlist Builder' }}>{page}</InternalLayout>;

export default PlaylistBuilder;