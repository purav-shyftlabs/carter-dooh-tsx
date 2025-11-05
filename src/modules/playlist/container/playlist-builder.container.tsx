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
import { Folder as FolderIcon, EyeIcon, TrashIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { getFileIcon } from '@/utils/file-icons';
import PageHeader from '@/components/page-header/page-header.component';
import { Button } from 'shyftlabs-dsl';
import { useRouter } from 'next/router';
import useAlert from '@/contexts/alert/alert.hook';
import { AlertVariant } from '@/contexts/alert/alert.provider';
import ROUTES from '@/common/routes';
import { playlistRenderService } from '@/services/content/playlist.service';
import { Stepper, StepConfig } from '@/components/common/stepper';

const isVideo = (contentType: string | undefined) => typeof contentType === 'string' && contentType.startsWith('video/');
const isImage = (contentType: string | undefined) => typeof contentType === 'string' && contentType.startsWith('image/');

const PlaylistBuilder: NextPageWithLayout = () => {
  const { playlist, reorder, addItem, setName, clear } = usePlaylistStore();
  const [detectingDuration, setDetectingDuration] = useState<Set<string>>(new Set());
  const [videoFirstFrames, setVideoFirstFrames] = useState<Record<string, string>>({});
  const router = useRouter();
  const { showAlert } = useAlert();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
  const [typeFilter, setTypeFilter] = useState<'image' | 'video' | 'website'>('image');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [websiteName, setWebsiteName] = useState('');
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [status, setStatus] = useState('active');
  const [thumbnailUrlError, setThumbnailUrlError] = useState('');
  
  // Stepper state
  const [currentStep, setCurrentStep] = useState('playlist-details');
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Form validation function
  const isFormValid = () => {
    if (currentStep === 'playlist-details') {
      return playlist.name.trim() !== '';
    }
    return true;
  };

  // Stepper configuration
  const steps: StepConfig[] = [
    {
      id: 'playlist-creation',
      title: 'Playlist Creation',
      subSteps: [
        { 
          id: 'playlist-details', 
          title: 'Playlist Details',
          validated: completedSteps.includes('playlist-details'),
          disabled: false
        },
        { 
          id: 'add-content', 
          title: 'Add Content',
          validated: completedSteps.includes('add-content'),
          disabled: currentStep === 'playlist-details' && !isFormValid()
        }
      ]
    }
  ];

  // Step navigation functions
  const goToNextStep = () => {
    if (!isFormValid()) {
      return;
    }
    
    if (currentStep === 'playlist-details') {
      setCurrentStep('add-content');
      setCompletedSteps(prev => [...prev, 'playlist-details']);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep === 'add-content') {
      setCurrentStep('playlist-details');
      setCompletedSteps(prev => prev.filter(step => step !== 'playlist-details'));
    }
  };

  const handleSubStepClick = (subStepId: string) => {
    // Allow navigation to completed steps or current step
    if (subStepId === 'playlist-details') {
      setCurrentStep('playlist-details');
      setCompletedSteps(prev => prev.filter(step => step !== 'playlist-details'));
    } else if (subStepId === 'add-content' && (completedSteps.includes('playlist-details') || isFormValid())) {
      setCurrentStep('add-content');
      setCompletedSteps(prev => [...prev, 'playlist-details']);
    }
  };

  // URL validation function
  const isValidUrl = (url: string): boolean => {
    if (!url.trim()) return true; // Empty URL is valid (optional field)
    
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleThumbnailUrlChange = (value: string) => {
    setThumbnailUrl(value);
    
    if (value.trim() && !isValidUrl(value)) {
      setThumbnailUrlError('Please enter a valid URL');
    } else {
      setThumbnailUrlError('');
    }
  };

  // Function to completely reset the form
  const resetForm = () => {
    clear(); // Clear playlist store (items, contents, name)
    setDescription('');
    setCategory('');
    setTags('');
    setThumbnailUrl('');
    setThumbnailUrlError('');
    setStatus('active');
    setCurrentStep('playlist-details'); // Reset stepper to first step
    setCompletedSteps([]);
  };

  // Load playlist data for edit mode
  useEffect(() => {
    const id = router.query.id as string | undefined;
    if (!id) {
      setIsEditMode(false);
      // Clear all states when in create mode
      clear(); // Clear playlist store (items, contents, name)
      setDescription('');
      setCategory('');
      setTags('');
      setThumbnailUrl('');
      setThumbnailUrlError('');
      setStatus('active');
      return;
    }

    setIsEditMode(true);
    const loadPlaylist = async () => {
      try {
        setIsLoading(true);
        const playlistData = await playlistRenderService.getPlaylistById(id);
        
        setName(playlistData.name || '');
        setDescription(playlistData.description || '');
        setCategory(playlistData.metadata?.category || '');
        setTags(playlistData.metadata?.tags?.join(', ') || '');
        setThumbnailUrl(playlistData.thumbnail_url || '');
        setStatus(playlistData.status || 'active');

        // Load existing contents into playlist store
        if (playlistData.contents && playlistData.contents.length > 0) {
          // Transform contents to playlist items format
          const playlistItems = playlistData.contents
            .sort((a, b) => a.order_index - b.order_index) // Sort by order_index
            .map((content, index) => {
              // Get the correct URL based on content type
              let url = '';
              if (content.type === 'image') {
                url = content.image_url || '';
              } else if (content.type === 'video') {
                url = content.video_url || '';
              } else if (content.type === 'website') {
                url = content.website_url || '';
              }

              return {
                id: `content-${content.id}`,
                assetId: `content-${content.id}`,
                type: content.type,
                url: url,
                thumbnailUrl: url, // Use the same URL for thumbnail
                name: content.name,
                duration: content.duration_seconds,
                order: index, // Use index for proper ordering
              };
            });

          // Load the playlist with existing items
          const { load } = usePlaylistStore.getState();
          load({
            id: 'local',
            name: playlistData.name,
            items: playlistItems,
            contents: [],
          });
        } else {
          // Clear if no contents
          clear();
        }
      } catch (e: any) {
        console.error('Error loading playlist:', e);
        let errorMessage = 'Failed to load playlist data. Please try again.';
        
        if (e?.response?.data?.message) {
          errorMessage = e.response.data.message;
        } else if (e?.message) {
          errorMessage = e.message;
        }
        
        showAlert(errorMessage, AlertVariant.ERROR);
        router.push(ROUTES.PLAYLIST.LIST);
      } finally {
        setIsLoading(false);
      }
    };

    loadPlaylist();
  }, [router.query.id, showAlert, router, setName, clear, setDescription, setCategory, setTags, setThumbnailUrl, setThumbnailUrlError, setStatus]);

  // Ensure form is cleared when component first mounts in create mode
  useEffect(() => {
    const id = router.query.id as string | undefined;
    if (!id && !isEditMode) {
      // Clear all states when first visiting create mode
      clear();
      setDescription('');
      setCategory('');
      setTags('');
      setThumbnailUrl('');
      setThumbnailUrlError('');
      setStatus('active');
    }
  }, []); // Run only once on mount

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
          // Use signed URL for secure access
          const fileUrl = await contentService.getFileUrl(f);
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
        } catch (error) {
          console.error('Failed to load file URL for', f.id, error);
          // Fallback to direct URL
          const fallbackUrl = contentService.getFileUrlSync(f);
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

  // Capture first frames for videos in playlist
  useEffect(() => {
    const captureFrames = async () => {
      const videoItems = playlist.items.filter(item => item.type === 'video');
      
      for (const item of videoItems) {
        if (!videoFirstFrames[item.id]) {
          try {
            // Try to get signed URL for first frame capture, but fallback to original URL
            let processingUrl = item.url;
            try {
              // Find the asset to get signed URL
              const asset = library.find(f => String(f.id) === item.assetId);
              if (asset) {
                const signedUrl = await contentService.getFileUrl(asset);
                processingUrl = signedUrl;
              }
            } catch (error) {
              console.warn('Failed to get signed URL for first frame capture, using original URL');
            }
            
            const firstFrame = await captureVideoFirstFrame(processingUrl);
            setVideoFirstFrames(prev => ({
              ...prev,
              [item.id]: firstFrame
            }));
          } catch (error) {
            console.warn(`Failed to capture first frame for video ${item.id}:`, error);
          }
        }
      }
    };

    if (playlist.items.length > 0) {
      captureFrames();
    }
  }, [playlist.items, videoFirstFrames, library]);

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
      const matchesType = typeFilter === 'image' ? isImage(file.content_type) : 
                         typeFilter === 'video' ? isVideo(file.content_type) : false;
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
  const websiteCount = useMemo(() => playlist.items.filter(item => item.type === 'website').length, [playlist.items]);

  const handleSubmit = async () => {
    // Validate thumbnail URL before submitting
    if (thumbnailUrl.trim() && !isValidUrl(thumbnailUrl)) {
      setThumbnailUrlError('Please enter a valid URL');
      return;
    }

    setSubmitting(true);
    try {
      const id = router.query.id as string | undefined;

      if (id) {
        // Update flow - call the API
        // Transform playlist items to contents format
        const contents = (playlist.items || []).map((item, index) => {
          const baseContent = {
            type: item.type,
            name: item.name || `Item ${index + 1}`,
            duration_seconds: item.duration,
            order_index: index + 1,
            metadata: {
              alt_text: item.name || `Item ${index + 1}`,
            },
          };

          if (item.type === 'image') {
            return { ...baseContent, image_url: item.url };
          } else if (item.type === 'video') {
            return { ...baseContent, video_url: item.url };
          } else if (item.type === 'website') {
            return { ...baseContent, website_url: item.url };
          }
          return baseContent;
        });

        const payload = {
          name: playlist.name,
          description: description.trim() || undefined,
          metadata: {
            category: category.trim() || undefined,
            tags: tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined,
          },
          thumbnail_url: thumbnailUrl.trim() || undefined,
          status,
          contents,
        };

        await playlistRenderService.updatePlaylist(id, payload as any);
        showAlert('Playlist updated successfully', AlertVariant.SUCCESS);
        // Mark the add-content step as completed
        setCompletedSteps(prev => [...prev, 'add-content']);
        router.push(ROUTES.PLAYLIST.LIST);
      } else {
        // Create flow - call the API
        // Transform playlist items to contents format
        const contents = (playlist.items || []).map((item, index) => {
          const baseContent = {
            type: item.type,
            name: item.name || `Item ${index + 1}`,
            duration_seconds: item.duration,
            order_index: index + 1,
            metadata: {
              alt_text: item.name || `Item ${index + 1}`,
            },
          };

          if (item.type === 'image') {
            return { ...baseContent, image_url: item.url };
          } else if (item.type === 'video') {
            return { ...baseContent, video_url: item.url };
          } else if (item.type === 'website') {
            return { ...baseContent, website_url: item.url };
          }
          return baseContent;
        });

        const payload = {
          name: playlist.name,
          description,
          metadata: {
            category: category || undefined,
            tags: tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined,
          },
          thumbnail_url: thumbnailUrl || undefined,
          status,
          contents,
        };

        const res = await playlistRenderService.createPlaylist(payload as any);
        console.log('Playlist created successfully:', res);
        
        // Mark the add-content step as completed before clearing
        setCompletedSteps(prev => [...prev, 'add-content']);
        
        // Clear the entire form after successful creation
        resetForm();
        
        showAlert('Playlist created successfully', AlertVariant.SUCCESS);
        router.push(ROUTES.PLAYLIST.LIST);
      }
    } catch (e: any) {
      console.error('Error submitting playlist:', e);
      
      // Extract error message from API response
      let errorMessage = isEditMode ? 'Failed to update playlist. Please try again.' : 'Failed to create playlist. Please try again.';
      
      if (e?.response?.data?.message) {
        errorMessage = e.response.data.message;
      } else if (e?.message) {
        errorMessage = e.message;
      }
      
      showAlert(errorMessage, AlertVariant.ERROR);
    } finally {
      setSubmitting(false);
    }
  };

  const Actions: React.FC = () => (
    <div style={{ display: 'flex', gap: 8 }}>
      {currentStep === 'add-content' && (
        <Button 
          label="Previous" 
          variant="secondary" 
          size="small" 
          onClick={goToPreviousStep}
          icon={<ChevronLeft size={16} />}
          iconPosition="left"
        />
      )}
      {currentStep === 'playlist-details' && (
        <Button 
          label="Next" 
          variant="primary" 
          size="small" 
          onClick={goToNextStep}
          disabled={!isFormValid()}
          icon={<ChevronRight size={16} />}
          iconPosition="right"
        />
      )}
      {currentStep === 'add-content' && (
        <>
          {!isEditMode && (
            <Button disabled={playlist.items.length === 0} onClick={() => window.confirm('Clear all items?') && resetForm()} label="Clear" icon={<TrashIcon size={10} />} iconPosition="left" variant="danger" />
          )}
          <Button disabled={playlist.items.length <= 1} onClick={() => setPreviewOpen(true)} label="Preview" icon={<EyeIcon size={10} />} iconPosition="left" variant="tertiary" />
          <Button 
            disabled={submitting || !playlist.name || (!isEditMode && playlist.items.length <= 1)} 
            onClick={handleSubmit} 
            label={submitting ? (isEditMode ? 'Updating...' : 'Saving...') : (isEditMode ? 'Update Playlist' : 'Create Playlist')} 
          />
        </>
      )}
      <Button 
        label="Cancel" 
        variant="secondary" 
        size="small" 
        onClick={() => router.push(ROUTES.PLAYLIST.LIST)} 
      />
    </div>
  );

  const handleAddFromLibrary = async (asset: LibraryFile) => {
    // Store original URL in playlist store, not signed URL
    const originalUrl = asset.fileUrl || '';
    const originalThumbnailUrl = asset.fileUrl || '';
    
    const newId = addItem({
      assetId: String(asset.id),
      type: isVideo(asset.content_type) ? 'video' : 'image',
      url: originalUrl, // Store original URL
      thumbnailUrl: originalThumbnailUrl, // Store original thumbnail URL
      name: asset.original_filename || asset.name,
    });

    // For videos: extract duration from metadata with better error handling
    if (isVideo(asset.content_type)) {
      setDetectingDuration(prev => new Set(prev).add(newId));
      try {
        let videoDuration = 0;
        
        // Try to get signed URL for duration extraction, but fallback to original URL
        let processingUrl = originalUrl;
        try {
          const signedUrl = await contentService.getFileUrl(asset);
          processingUrl = signedUrl;
        } catch (error) {
          console.warn('Failed to get signed URL, using original URL for duration extraction');
        }
        
        try {
          videoDuration = await extractVideoDuration(processingUrl);
        } catch (error) {
          console.warn('Duration extraction failed:', error);
          throw new Error('Duration extraction failed');
        }
        
        if (videoDuration > 0) {
          usePlaylistStore.getState().updateDuration(newId, videoDuration);
        }
      } catch (error) {
        // Keep default duration (10 seconds) if extraction fails
      } finally {
        setDetectingDuration(prev => {
          const newSet = new Set(prev);
          newSet.delete(newId);
          return newSet;
        });
      }
    }
  };

  // Function to capture first frame of video
  const captureVideoFirstFrame = (videoUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        video.currentTime = 0.1; // Seek to first frame
      };
      
      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataURL = canvas.toDataURL('image/jpeg', 0.8);
            video.remove();
            resolve(dataURL);
          } else {
            video.remove();
            reject(new Error('Could not get canvas context'));
          }
        } catch (error) {
          video.remove();
          reject(error);
        }
      };
      
      video.onerror = () => {
        video.remove();
        reject(new Error('Failed to load video'));
      };
      
      video.src = videoUrl;
    });
  };

  // Manual retry function for video duration detection
  const retryVideoDuration = async (itemId: string, videoUrl: string) => {
    setDetectingDuration(prev => new Set(prev).add(itemId));
    try {
      const videoDuration = await extractVideoDuration(videoUrl);
      if (videoDuration > 0) {
        usePlaylistStore.getState().updateDuration(itemId, videoDuration);
      }
    } catch (error) {
      // Silent fail
    } finally {
      setDetectingDuration(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  // Helper function to extract video duration with multiple fallback strategies
  const extractVideoDuration = (videoUrl: string): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      // Try different CORS strategies
      const corsStrategies = ['anonymous', 'use-credentials', null];
      let currentStrategyIndex = 0;
      
      const tryNextStrategy = () => {
        if (currentStrategyIndex < corsStrategies.length) {
          video.crossOrigin = corsStrategies[currentStrategyIndex];
          currentStrategyIndex++;
          video.src = videoUrl;
        } else {
          // All strategies failed, use fallback duration
          video.remove();
          resolve(10); // Default 10 seconds fallback
        }
      };
      
      const timeout = setTimeout(() => {
        video.remove();
        reject(new Error('Video duration extraction timeout'));
      }, 15000); // 15 second timeout
      
      video.onloadedmetadata = () => {
        clearTimeout(timeout);
        const rawDuration = video.duration || 1;
        // Handle decimal seconds more precisely - round to nearest 0.1 second then ceil
        const preciseDuration = Math.ceil(Math.round(rawDuration * 10) / 10);
        const duration = Math.max(1, preciseDuration);
        video.remove();
        resolve(duration);
      };
      
      video.onerror = (error) => {
        tryNextStrategy();
      };
      
      // Start with first strategy
      tryNextStrategy();
    });
  };

  const handleAddWebsite = () => {
    if (!websiteUrl.trim() || !isValidUrl(websiteUrl)) {
      return;
    }

    const newId = addItem({
      assetId: `website-${Date.now()}`,
      type: 'website',
      url: websiteUrl.trim(),
      thumbnailUrl: websiteUrl.trim(), // Use URL as thumbnail for iframe preview
      name: websiteName.trim() || 'Website',
    });

    // Clear the form
    setWebsiteUrl('');
    setWebsiteName('');
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

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        Loading playlist...
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={isEditMode ? "Edit Playlist" : "Add Playlist"} ActionComponent={Actions} />
      
      <div className={styles.wrapper}>
        {/* Left Sidebar - Stepper */}
        <div className={styles.stepperSidebar}>
          <Stepper
            steps={steps}
            currentStepId="playlist-creation"
            currentSubStepId={currentStep}
            completedStepIds={completedSteps}
            completedSubStepIds={completedSteps}
            validatedSubStepIds={steps[0].subSteps?.filter(sub => sub.validated).map(sub => sub.id) || []}
            disabledSubStepIds={steps[0].subSteps?.filter(sub => sub.disabled).map(sub => sub.id) || []}
            handleSubStepClick={handleSubStepClick}
            title="Progress"
          />
        </div>

        {/* Right Content Area */}
        <div className={styles.contentArea}>
        {currentStep === 'playlist-details' ? (
          <div className={styles.detailsStep}>
            <div className={styles.detailsForm}>
              <div className={styles.formSection}>
                <h3 className={styles.sectionTitle}>Playlist Details</h3>
                <div className={styles.formGrid}>
                  <div className={styles.formCell}>
                    <label className={styles.formLabel}>Name *</label>
                    <RMNInput
                      className={styles.formEqual}
                      placeholder="Enter playlist name"
                      size="small"
                      value={playlist.name}
                      onChange={(e) => setName((e.target as HTMLInputElement).value)}
                    />
                  </div>
                  <div className={styles.formCell}>
                    <label className={styles.formLabel}>Description</label>
                    <RMNInput
                      className={styles.formEqual}
                      placeholder="Enter playlist description"
                      size="small"
                      value={description}
                      onChange={(e) => setDescription((e.target as HTMLInputElement).value)}
                    />
                  </div>
                  <div className={styles.formCell}>
                    <label className={styles.formLabel}>Category</label>
                    <RMNInput
                      className={styles.formEqual}
                      placeholder="e.g., promotional, informational"
                      size="small"
                      value={category}
                      onChange={(e) => setCategory((e.target as HTMLInputElement).value)}
                    />
                  </div>
                  <div className={styles.formCell}>
                    <label className={styles.formLabel}>Tags</label>
                    <RMNInput
                      className={styles.formEqual}
                      placeholder="e.g., summer, sale, holiday (comma separated)"
                      size="small"
                      value={tags}
                      onChange={(e) => setTags((e.target as HTMLInputElement).value)}
                    />
                  </div>
                  <div className={styles.formCell}>
                    <label className={styles.formLabel}>Thumbnail URL</label>
                    <RMNInput
                      className={styles.formEqual}
                      placeholder="https://example.com/thumbnail.jpg"
                      size="small"
                      value={thumbnailUrl}
                      onChange={(e) => handleThumbnailUrlChange((e.target as HTMLInputElement).value)}
                    />
                    {thumbnailUrlError && (
                      <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>
                        {thumbnailUrlError}
                      </div>
                    )}
                  </div>
                  <div className={styles.formCell}>
                    <label className={styles.formLabel}>Status *</label>
                    <select
                      className={styles.formEqual}
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        backgroundColor: 'white',
                        height: '40px',
                      }}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.contentStep}>
            {/* Timeline Section */}
            <div className={styles.timelineSection}>
              <h3 className={styles.sectionTitle}>Timeline</h3>
              
              
              <div className={styles.timeline} ref={timelineRef}>
                <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
                  <SortableContext items={playlist.items.map(i => i.id)} strategy={horizontalListSortingStrategy}>
                    <div className={styles.timelineList}>
                      {playlist.items.length === 0 && (
                        <div className={styles.placeholder}>
                          <div className={styles.placeholderTitle}>Build your playlist</div>
                          <div className={styles.placeholderDesc}>Select media from below and click to add here. Drag to reorder, edit durations inline.</div>
                        </div>
                      )}
                      {playlist.items.map((item: PlaylistItem, idx: number) => (
                        <TimelineItem 
                          key={item.id} 
                          item={item} 
                          index={idx} 
                          draggingId={draggingId} 
                          isDetectingDuration={detectingDuration.has(item.id)}
                          onRetryDuration={item.type === 'video' ? () => retryVideoDuration(item.id, item.url) : undefined}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            </div>

            {/* Media Library Section */}
            <div className={styles.mediaLibrarySection}>
              <div className={styles.header}>
                <h3 className={styles.headerTitle}>Media Library</h3>
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
                    <button className={`${styles.chip} ${typeFilter === 'image' ? styles.active : ''}`} onClick={() => setTypeFilter('image')}>Images ({imageCount})</button>
                    <button className={`${styles.chip} ${typeFilter === 'video' ? styles.active : ''}`} onClick={() => setTypeFilter('video')}>Videos ({videoCount})</button>
                    <button className={`${styles.chip} ${typeFilter === 'website' ? styles.active : ''}`} onClick={() => setTypeFilter('website')}>Websites ({websiteCount})</button>
                  </div>
                  <input className={styles.searchInput} placeholder="Search media..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
              </div>
              <div className={`${styles.libraryGrid} ${contentItemStyles.grid}`}>
                {typeFilter === 'website' ? (
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
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

      {previewOpen && (
        <PreviewPlayer onClose={() => setPreviewOpen(false)} />
      )}
    </div>
  );
};

export default PlaylistBuilder;