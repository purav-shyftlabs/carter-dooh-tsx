import React from 'react';
import { Folder, File as FileType } from '@/types/folder';
import { contentService } from '@/services/content/content.service';
import { getFileIcon } from '@/utils/file-icons';
import styles from '../styles/folder-item.module.scss';
import { Folder as FolderIcon } from 'lucide-react';

interface FolderItemProps {
  folder: Folder;
  onClick: (folder: Folder) => void;
  onContextMenu?: (folder: Folder, event: React.MouseEvent) => void;
}

interface FileItemProps {
  file: FileType;
  onClick: (file: FileType) => void;
  onContextMenu?: (file: FileType, event: React.MouseEvent) => void;
  isDownloading?: boolean;
}

export const FolderItem: React.FC<FolderItemProps> = ({ folder, onClick, onContextMenu }) => {
  const handleClick = () => {
    onClick(folder);
  };

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    if (onContextMenu) {
      onContextMenu(folder, event);
    }
  };

  return (
    <div
      className={styles.item}
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
      <div className={styles.icon}>
        <FolderIcon />
      </div>
      <div className={styles.content}>
        <div className={styles.name}>{folder.name}</div>
        <div className={styles.meta}>
          Folder
        </div>
      </div>
    </div>
  );
};

export const FileItem: React.FC<FileItemProps> = ({ file, onClick, onContextMenu, isDownloading = false }) => {
  const handleClick = () => {
    if (!isDownloading) {
      onClick(file);
    }
  };

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    if (onContextMenu) {
      onContextMenu(file, event);
    }
  };

  const fileIcon = getFileIcon(file.content_type, file.original_filename);
  const fileSize = contentService.formatFileSize(file.file_size);


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
          handleClick();
        }
      }}
    >
      <div className={styles.icon}>
        {isDownloading ? '⏳' : fileIcon}
      </div>
      <div className={styles.content}>
        <div className={styles.name}>
          {file.original_filename}
          {isDownloading && <span className={styles.downloadingText}> (Downloading...)</span>}
        </div>
        <div className={styles.meta}>
          {fileSize} • {file.metadata?.uploadedAt ? new Date(file.metadata.uploadedAt).toLocaleDateString() : 'Unknown date'}
        </div>
      </div>
    </div>
  );
};
