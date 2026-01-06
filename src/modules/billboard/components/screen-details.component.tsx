import React, { useState, useEffect } from 'react';
import { Button } from 'shyftlabs-dsl';
import { ArrowLeft, RefreshCw, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import { useRouter } from 'next/router';
import styles from '../styles/screen-details.module.scss';
import { screensService } from '@/services/screens/screens.service';
import { contentService } from '@/services/content/content.service';
import type { Screen, CurrentScreenContent } from '@/types/screens';
import PageHeader from '@/components/page-header/page-header.component';
import ROUTES from '@/common/routes';
import useAlert from '@/contexts/alert/alert.hook';
import { AlertVariant } from '@/contexts/alert/alert.provider';

interface ScreenDetailsProps {
  screenId: string | number;
}

const ScreenDetails: React.FC<ScreenDetailsProps> = ({ screenId }) => {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [screen, setScreen] = useState<Screen | null>(null);
  const [currentContent, setCurrentContent] = useState<CurrentScreenContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contentImageUrl, setContentImageUrl] = useState<string>('');

  useEffect(() => {
    const loadScreen = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('Loading screen with ID:', screenId);
        const response = await screensService.getScreenById(screenId);
        console.log('Screen loaded:', response);
        setScreen(response);
      } catch (err) {
        console.error('Error loading screen:', err);
        setError('Failed to load screen details');
        if (err && typeof err === 'object' && 'response' in err) {
          const axiosError = err as { response?: { status?: number; data?: unknown } };
          if (axiosError.response?.status === 404) {
            setError('Screen not found');
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (screenId) {
      loadScreen();
    }
  }, [screenId]);

  // Load current content
  useEffect(() => {
    const loadCurrentContent = async () => {
      if (!screenId) return;
      
      try {
        setIsLoadingContent(true);
        console.log('Loading current content for screen:', screenId);
        const content = await screensService.getCurrentScreenContent(screenId);
        console.log('Current content loaded:', content);
        setCurrentContent(content);
        
        // Load image URL if content exists
        if (content.hasContent && content.content?.file) {
          // First, try to use URL directly from the content response
          const directUrl = content.content.file.url;
          if (directUrl) {
            setContentImageUrl(directUrl);
          } else {
            // If no direct URL, try to get it from the file service
            try {
              const fileResponse = await contentService.getFileById(content.content.file.id);
              const file = fileResponse.data;
              // Try with signed URL first, but it will fallback automatically if it fails
              const imageUrl = await contentService.getFileUrl(file, true);
              setContentImageUrl(imageUrl);
            } catch (urlError) {
              console.error('Error loading image URL:', urlError);
              // Final fallback: Use fileUrl from the file object
              const fileResponse = await contentService.getFileById(content.content.file.id).catch(() => null);
              if (fileResponse?.data?.fileUrl) {
                setContentImageUrl(fileResponse.data.fileUrl);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading current content:', error);
      } finally {
        setIsLoadingContent(false);
      }
    };

    if (screenId) {
      loadCurrentContent();
    }
  }, [screenId]);

  const handleRefresh = async () => {
    if (!screenId) return;
    try {
      setIsLoading(true);
      setError(null);
      const [screenResponse, contentResponse] = await Promise.all([
        screensService.getScreenById(screenId),
        screensService.getCurrentScreenContent(screenId),
      ]);
      setScreen(screenResponse);
      setCurrentContent(contentResponse);
      
      // Reload image URL if content exists
      if (contentResponse.hasContent && contentResponse.content?.file) {
        // First, try to use URL directly from the content response
        const directUrl = contentResponse.content.file.url;
        if (directUrl) {
          setContentImageUrl(directUrl);
        } else {
          // If no direct URL, try to get it from the file service
          try {
            const fileResponse = await contentService.getFileById(contentResponse.content.file.id);
            const file = fileResponse.data;
            // Try with signed URL first, but it will fallback automatically if it fails
            const imageUrl = await contentService.getFileUrl(file, true);
            setContentImageUrl(imageUrl);
          } catch (urlError) {
            console.error('Error loading image URL:', urlError);
            // Final fallback: Use fileUrl from the file object
            const fileResponse = await contentService.getFileById(contentResponse.content.file.id).catch(() => null);
            if (fileResponse?.data?.fileUrl) {
              setContentImageUrl(fileResponse.data.fileUrl);
            }
          }
        }
      }
      
      showAlert('Screen details refreshed', AlertVariant.SUCCESS);
    } catch (err) {
      console.error('Error refreshing screen:', err);
      showAlert('Failed to refresh screen details', AlertVariant.ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!screen) return;
    if (!confirm('Are you sure you want to delete this screen? This action cannot be undone.')) {
      return;
    }
    try {
      setIsDeleting(true);
      await screensService.deleteScreen(screenId);
      showAlert('Screen deleted successfully', AlertVariant.SUCCESS);
      router.push(ROUTES.BILLBOARD.LIST);
    } catch (err) {
      console.error('Error deleting screen:', err);
      showAlert('Failed to delete screen', AlertVariant.ERROR);
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadgeClass = (status: string | undefined) => {
    if (!status) return '';
    const statusLower = String(status).toLowerCase();
    switch (statusLower) {
      case 'active':
        return styles.statusActive;
      case 'inactive':
        return styles.statusInactive;
      case 'maintenance':
        return styles.statusMaintenance;
      case 'paired':
        return styles.statusPaired;
      default:
        return '';
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Never';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  if (isLoading) {
    return (
      <div className={styles.screenDetailsContainer}>
        <div className={styles.loading}>Loading screen details...</div>
      </div>
    );
  }

  if (error && !screen) {
    return (
      <div className={styles.screenDetailsContainer}>
        <PageHeader
          title="Screen Details"
          ActionComponent={() => (
            <Button
              label="Back"
              icon={<ArrowLeft />}
              onClick={() => router.push(ROUTES.BILLBOARD.LIST)}
              variant="tertiary"
              size="small"
              iconPosition="left"
            />
          )}
        />
        <div className={styles.errorMessage}>{error}</div>
        <Button label="Go Back" onClick={() => router.push(ROUTES.BILLBOARD.LIST)} />
      </div>
    );
  }

  if (!screen) {
    return (
      <div className={styles.screenDetailsContainer}>
        <PageHeader
          title="Screen Details"
          ActionComponent={() => (
            <Button
              label="Back"
              icon={<ArrowLeft />}
              onClick={() => router.push(ROUTES.BILLBOARD.LIST)}
              variant="tertiary"
              size="small"
              iconPosition="left"
            />
          )}
        />
        <div>Screen not found</div>
      </div>
    );
  }

  return (
    <div className={styles.screenDetailsContainer}>
      <PageHeader
        title={screen.name || 'Screen Details'}
        ActionComponent={() => (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              label="Back"
              icon={<ArrowLeft />}
              onClick={() => router.push(ROUTES.BILLBOARD.LIST)}
              variant="tertiary"
              size="small"
              iconPosition="left"
            />
            <Button
              label="Refresh"
              icon={<RefreshCw />}
              onClick={handleRefresh}
              variant="tertiary"
              size="small"
              iconPosition="left"
            />
            <Button
              label="Edit"
              icon={<Edit />}
              onClick={() => {
                // TODO: Navigate to edit screen page when implemented
                console.log('Edit screen clicked');
              }}
              variant="secondary"
              size="small"
              iconPosition="left"
            />
            <Button
              label="Delete"
              icon={<Trash2 />}
              onClick={handleDelete}
              variant="danger"
              size="small"
              iconPosition="left"
              disabled={isDeleting}
            />
          </div>
        )}
      />

      {error && <div className={styles.errorMessage}>{error}</div>}

      <div className={styles.screenContent}>
        <div className={styles.screenHeader}>
          <div className={styles.screenInfo}>
            <h1>{screen.name}</h1>
            <div className={styles.metaInfo}>
              <div className={styles.metaItem}>
                <strong>Status:</strong>{' '}
                <span className={`${styles.statusBadge} ${getStatusBadgeClass(screen.status)}`}>
                  {screen.status || 'Unknown'}
                </span>
              </div>
              <div className={styles.metaItem}>
                <strong>Online:</strong>{' '}
                <span className={screen.isOnline ? styles.online : styles.offline}>
                  {screen.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
            <div className={styles.screenInfoGrid}>
              <div className={styles.infoItem}>
                <strong>Screen ID:</strong>
                <span>{screen.id}</span>
              </div>
              <div className={styles.infoItem}>
                <strong>Device Name:</strong>
                <span>{screen.deviceName || screen.name || 'N/A'}</span>
              </div>
              <div className={styles.infoItem}>
                <strong>MAC Address:</strong>
                <span>{screen.macAddress || 'N/A'}</span>
              </div>
              {screen.deviceFingerprint && (
                <div className={styles.infoItem}>
                  <strong>Device Fingerprint:</strong>
                  <span className={styles.fingerprint}>{screen.deviceFingerprint}</span>
                </div>
              )}
              <div className={styles.infoItem}>
                <strong>Account ID:</strong>
                <span>{screen.account || screen.accountId || 'N/A'}</span>
              </div>
              <div className={styles.infoItem}>
                <strong>Brand ID:</strong>
                <span>{screen.brand || screen.brandId || 'N/A'}</span>
              </div>
            </div>
          </div>
          <div className={styles.currentContentHeader}>
            {isLoadingContent ? (
              <div className={styles.loadingSmall}>Loading...</div>
            ) : currentContent?.hasContent && currentContent.content && currentContent.content.file ? (
              <div className={styles.currentContentPreview}>
                {currentContent.content.file.contentType?.startsWith('image/') && contentImageUrl ? (
                  <img src={contentImageUrl} alt={currentContent.content.file.originalFilename || 'Content'} />
                ) : (
                  <div className={styles.contentIconSmall}>
                    <ImageIcon size={24} />
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.noContentSmall}>No content</div>
            )}
          </div>
        </div>

        <div className={styles.section}>
          <h2>Status & Activity</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <strong>Status:</strong>
              <span className={`${styles.statusBadge} ${getStatusBadgeClass(screen.status)}`}>
                {screen.status || 'Unknown'}
              </span>
            </div>
            <div className={styles.infoItem}>
              <strong>Online Status:</strong>
              <span className={screen.isOnline ? styles.online : styles.offline}>
                {screen.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className={styles.infoItem}>
              <strong>Last Seen:</strong>
              <span>{formatDate(screen.lastSeenAt)}</span>
            </div>
            {screen.pairedAt && (
              <div className={styles.infoItem}>
                <strong>Paired At:</strong>
                <span>{formatDate(screen.pairedAt)}</span>
              </div>
            )}
          </div>
        </div>

        <div className={styles.section}>
          <h2>Timestamps</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <strong>Created At:</strong>
              <span>{formatDate(screen.createdAt)}</span>
            </div>
            <div className={styles.infoItem}>
              <strong>Updated At:</strong>
              <span>{formatDate(screen.updatedAt)}</span>
            </div>
            {screen.deletedAt && (
              <div className={styles.infoItem}>
                <strong>Deleted At:</strong>
                <span className={styles.deleted}>{formatDate(screen.deletedAt)}</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ScreenDetails;

