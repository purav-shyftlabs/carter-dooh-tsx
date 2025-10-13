import React, { useState } from 'react';
import { Folder, File as FileType } from '@/types/folder';
import { contentService } from '@/services/content/content.service';
import { getFileIcon } from '@/utils/file-icons';
import styles from '../styles/folder-item.module.scss';
import { Folder as FolderIcon, UserPlus } from 'lucide-react';
import { ShareModal } from './share-modal.component';

interface FolderItemProps {
  folder: Folder;
  onClick: (folder: Folder) => void;
  onContextMenu?: (folder: Folder, event: React.MouseEvent) => void;
}

interface FileItemProps {
  file: FileType;
  onClick: (file: FileType, event: React.MouseEvent) => void;
  onContextMenu?: (file: FileType, event: React.MouseEvent) => void;
  isDownloading?: boolean;
}

export const FolderItem: React.FC<FolderItemProps> = ({ folder, onClick, onContextMenu }) => {
  const [showShareModal, setShowShareModal] = useState(false);

  const handleClick = () => {
    onClick(folder);
  };

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    if (onContextMenu) {
      onContextMenu(folder, event);
    }
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShareModal(true);
  };

  return (
    <div
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className={styles.itemContent + ' ' + styles.folderCard}>
        {/* Folder icon */}
        <FolderIcon size={72} color="#12287c" />

        {/* Share button (visible on hover via CSS) */}
        <button
          aria-label="Share folder"
          onClick={handleShareClick}
          className={styles.shareButton}
        >
          <UserPlus size={18} color="#12287c" />
        </button>

        {/* Folder name */}
        <div className={styles.name}>
          {folder.name}
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        fileId={Number(folder.id)}
        fileName={folder.name}
        isFolder={true}
      />
      
    </div>
  );
};

export const FileItem: React.FC<FileItemProps> = ({ file, onClick, onContextMenu, isDownloading = false }) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const handleClick = (event: React.MouseEvent) => {
    if (!isDownloading) {
      onClick(file, event);
    }
  };

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    if (onContextMenu) {
      onContextMenu(file, event);
    }
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShareModal(true);
  };

  const fileIcon = getFileIcon(file.content_type, file.original_filename, 'normal');

  // Load image preview for image files
  React.useEffect(() => {
    const isImage = String(file.content_type || '').startsWith('image/');
    if (!isImage) {
      setPreviewUrl('');
      return;
    }
    // Use direct GCP URL
    const url = contentService.getFileUrl(file);
    setPreviewUrl(url);
  }, [file.id, file.content_type]);

  return (
    <div
      className={`${styles.item} ${isDownloading ? styles.downloading : ''}`}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(file, {
            // minimal MouseEvent-like shape for handler compatibility
            preventDefault: () => undefined,
          } as unknown as React.MouseEvent);
        }
      }}
    >
      <div className={styles.itemContent + ' ' + styles.folderCard}>
        {/* File preview or icon */}
        {previewUrl ? (
          <img className={styles.fileThumb} src={previewUrl} alt={String(file.original_filename || file.name)} />
        ) : (
          <span className={styles.fileIcon}>{fileIcon}</span>
        )}

        {/* Share button (visible on hover via CSS) */}
        <button
          aria-label="Share file"
          onClick={handleShareClick}
          className={styles.shareButton}
        >
          <UserPlus size={18} color="#12287c" />
        </button>

        {/* File name */}
        <div className={styles.name}>
          {file.original_filename}
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        fileId={Number(file.id)}
        fileName={file.original_filename}
        isFolder={false}
      />
    </div>
  );
};