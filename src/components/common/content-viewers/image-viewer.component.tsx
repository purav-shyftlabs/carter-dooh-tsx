import { useEffect, useState } from 'react';
import { contentService } from '@/services/content/content.service';
import type { File as LibraryFile } from '@/types/folder';
import styles from './content-viewers.module.scss';

export type ImageViewerProps = {
  file?: LibraryFile;
  url?: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
};

const ImageViewer: React.FC<ImageViewerProps> = ({
  file,
  url,
  alt,
  className,
  style,
  onLoad,
  onError,
}) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      if (url) {
        setImageUrl(url);
        setIsLoading(false);
        return;
      }

      if (file) {
        try {
          setIsLoading(true);
          setHasError(false);
          const signedUrl = await contentService.getFileUrl(file);
          setImageUrl(signedUrl);
        } catch (error) {
          console.error('Failed to load image URL:', error);
          const fallbackUrl = contentService.getFileUrlSync(file);
          setImageUrl(fallbackUrl);
          setHasError(true);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadImage();
  }, [file, url]);

  if (isLoading) {
    return (
      <div className={`${styles.loadingContainer} ${className || ''}`} style={style}>
        <div className={styles.loadingSpinner}>Loading...</div>
      </div>
    );
  }

  if (hasError && !imageUrl) {
    return (
      <div className={`${styles.errorContainer} ${className || ''}`} style={style}>
        <div>Failed to load image</div>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt || file?.original_filename || file?.name || 'Image'}
      className={className}
      style={{ 
        maxWidth: '100%', 
        maxHeight: '100%', 
        width: 'auto',
        height: 'auto',
        objectFit: 'contain',
        objectPosition: 'center',
        display: 'block',
        ...style 
      }}
      onLoad={onLoad}
      onError={() => {
        setHasError(true);
        if (onError) onError();
      }}
    />
  );
};

export default ImageViewer;

