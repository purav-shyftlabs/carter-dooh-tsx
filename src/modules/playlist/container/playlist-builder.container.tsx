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
import type { File as LibraryFile } from '@/types/folder';
import React from 'react';
import InternalLayout from '@/layouts/internal-layout/internal-layout';
import { NextPageWithLayout } from '@/types/common';
import { EyeIcon, TrashIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import PageHeader from '@/components/page-header/page-header.component';
import { Button } from 'shyftlabs-dsl';
import { useRouter } from 'next/router';
import useAlert from '@/contexts/alert/alert.hook';
import { AlertVariant } from '@/contexts/alert/alert.provider';
import ROUTES from '@/common/routes';
import { playlistRenderService } from '@/services/content/playlist.service';
import { Stepper, StepConfig } from '@/components/common/stepper';
import { IntegrationSelector } from '@/components/common/integration-selector';
import { Plug2 } from 'lucide-react';
import { MediaLibrary } from '@/components/common/media-library';
import type { Integration } from '@/types/integrations';

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
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<'image' | 'video' | 'website' | 'integration'>('image');
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

              // Debug logging for integration content
              if (content.type === 'integration') {
                console.log('Loading Integration Content:', {
                  contentId: content.id,
                  integrationId: content.integration_id,
                  integration: content.integration,
                  name: content.name
                });
              }

              return {
                id: `content-${content.id}`,
                assetId: content.type !== 'integration' ? `content-${content.id}` : undefined,
                type: content.type,
                url: url,
                integrationId: content.integration_id,
                thumbnailUrl: url, // Use the same URL for thumbnail
                name: content.name,
                duration: content.duration_seconds,
                order: index, // Use index for proper ordering
                integration: content.integration ? {
                  id: content.integration.id,
                  app_id: content.integration.app_id,
                  app_name: content.integration.app_name,
                  app_logo: content.integration.app_logo,
                  status: content.integration.status,
                } : undefined,
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


  // Capture first frames for videos in playlist
  useEffect(() => {
    const captureFrames = async () => {
      const videoItems = playlist.items.filter(item => item.type === 'video');
      
      for (const item of videoItems) {
        if (!videoFirstFrames[item.id] && item.url) {
          try {
            const firstFrame = await captureVideoFirstFrame(item.url);
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
  }, [playlist.items, videoFirstFrames]);


  const totalDuration = useMemo(() => playlist.items.reduce((acc, it) => acc + Math.max(1, Number(it.duration || 0)), 0), [playlist.items]);
  const formatSeconds = (s: number) => {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m > 0 ? `${m}m ${r}s` : `${r}s`;
  };

  // Counts will be calculated by MediaLibrary component internally
  const websiteCount = useMemo(() => playlist.items.filter(item => item.type === 'website').length, [playlist.items]);
  const integrationCount = useMemo(() => playlist.items.filter(item => item.type === 'integration').length, [playlist.items]);

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
          } else if (item.type === 'integration') {
            return { ...baseContent, integration_id: item.integrationId };
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
          } else if (item.type === 'integration') {
            return { ...baseContent, integration_id: item.integrationId };
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

  const handleAddWebsite = (name: string, url: string) => {
    if (!url.trim() || !isValidUrl(url)) {
      return;
    }

    addItem({
      assetId: `website-${Date.now()}`,
      type: 'website',
      url: url.trim(),
      thumbnailUrl: url.trim(), // Use URL as thumbnail for iframe preview
      name: name.trim() || 'Website',
    });
  };

  const handleAddIntegration = (integration: Integration) => {
    const integrationName = integration.app?.name || 'Integration';
    const cityConfig = integration.configurations?.find((c) => c.key === 'city');
    const cityName = cityConfig ? ` - ${cityConfig.value}` : '';
    const name = `${integrationName}${cityName}`;

    addItem({
      type: 'integration',
      integrationId: integration.id,
      name,
      duration: 30, // Default duration, can be edited later
      integration: {
        id: integration.id,
        app_id: integration.app_id,
        app_name: integration.app?.name || 'Unknown App',
        app_logo: integration.app?.logo_url,
        status: integration.status,
      },
    });

    showAlert('Integration added to playlist', AlertVariant.SUCCESS);
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
                          onRetryDuration={item.type === 'video' && item.url ? () => retryVideoDuration(item.id, item.url!) : undefined}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            </div>

            {/* Media Library Section */}
            <MediaLibrary
              title="Media Library"
              onItemSelect={handleAddFromLibrary}
              onWebsiteAdd={handleAddWebsite}
              integrationSelector={<IntegrationSelector onIntegrationSelect={handleAddIntegration} />}
              showWebsiteForm={true}
              showIntegrationSelector={true}
              typeFilter={typeFilter}
              onTypeFilterChange={setTypeFilter}
              websiteCount={websiteCount}
              integrationCount={integrationCount}
            />
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

PlaylistBuilder.getLayout = (page: React.ReactNode) => (
  <InternalLayout head={{ title: 'Playlist Builder', description: 'Playlist Builder' }}>{page}</InternalLayout>
);

export default PlaylistBuilder;