import React, { useEffect, useRef, useState } from 'react';
import { File as FileType } from '@/types/folder';
import { contentService } from '@/services/content/content.service';
import { X, Download, ZoomIn, ZoomOut } from 'lucide-react';
import styles from '../styles/image-preview-popup.module.scss';

interface ImagePreviewPopupProps {
  file: FileType | null;
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onDownload?: (file: FileType) => void;
}

export const ImagePreviewPopup: React.FC<ImagePreviewPopupProps> = ({
  file,
  isOpen,
  position,
  onClose,
  onDownload
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');

  // Reset scale and load image when file changes
  useEffect(() => {
    if (file) {
      setScale(1);
      setImageLoaded(false);
      
      // Use direct GCP URL
      const url = contentService.getFileUrl(file);
      setImageUrl(url);
    }
  }, [file]);

  // No cleanup needed for GCP URLs

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case '+':
        case '=':
          e.preventDefault();
          setScale(prev => Math.min(prev * 1.2, 3));
          break;
        case '-':
          e.preventDefault();
          setScale(prev => Math.max(prev / 1.2, 0.5));
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !file) return null;

  const isImage = file.content_type?.startsWith('image/');

  if (!isImage) return null;

  // Calculate popup position to keep it within viewport
  const getPopupPosition = () => {
    const popupWidth = 320;
    const popupHeight = 400;
    const margin = 20;
    
    let x = position.x;
    let y = position.y;
    
    // Adjust horizontal position if popup would go off screen
    if (x + popupWidth > window.innerWidth - margin) {
      x = window.innerWidth - popupWidth - margin;
    }
    if (x < margin) {
      x = margin;
    }
    
    // Adjust vertical position if popup would go off screen
    if (y + popupHeight > window.innerHeight - margin) {
      y = position.y - popupHeight - 10; // Show above the clicked item
    }
    if (y < margin) {
      y = margin;
    }
    
    return { x, y };
  };

  const popupPosition = getPopupPosition();

  return (
    <div 
      className={`${styles.overlay} ${isOpen ? styles.open : ''}`}
      onClick={onClose}
    >
      <div 
        ref={popupRef}
        className={`${styles.popup} ${imageLoaded ? styles.loaded : ''}`}
        style={{
          left: popupPosition.x,
          top: popupPosition.y,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.fileInfo}>
            <h4 className={styles.fileName}>{file.original_filename}</h4>
            <p className={styles.fileSize}>
              {file.file_size ? `${(Number(file.file_size) / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
            </p>
          </div>
          
          <div className={styles.controls}>
            <button
              className={styles.controlButton}
              onClick={(e) => {
                e.stopPropagation();
                setScale(prev => Math.max(prev / 1.2, 0.5));
              }}
              title="Zoom Out"
            >
              <ZoomOut size={16} />
            </button>
            
            <span className={styles.zoomLevel}>{Math.round(scale * 100)}%</span>
            
            <button
              className={styles.controlButton}
              onClick={(e) => {
                e.stopPropagation();
                setScale(prev => Math.min(prev * 1.2, 3));
              }}
              title="Zoom In"
            >
              <ZoomIn size={16} />
            </button>
            
            {onDownload && (
              <button
                className={styles.controlButton}
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload(file);
                }}
                title="Download"
              >
                <Download size={16} />
              </button>
            )}
            
            <button
              className={styles.controlButton}
              onClick={onClose}
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Image Container */}
        <div className={styles.imageContainer}>
          <img
            src={imageUrl}
            alt={file.original_filename}
            className={styles.image}
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'center center'
            }}
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              console.error('Failed to load image:', imageUrl);
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
          
          {!imageLoaded && (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Loading...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <p className={styles.instructions}>
            Use +/- to zoom • Click outside to close
          </p>
        </div>
      </div>
    </div>
  );
};
