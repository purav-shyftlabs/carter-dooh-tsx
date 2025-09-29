import React, { useState } from 'react';
import { Folder, File as FileType } from '@/types/folder';
import { contentService } from '@/services/content/content.service';
import { getFileIcon } from '@/utils/file-icons';
import styles from '../styles/folder-item.module.scss';
import { Folder as FolderIcon, Share2 as ShareIcon, UserPlus } from 'lucide-react';
import Avatar from 'react-avatar';
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
        {/* Top row: left folder icon, right share icon */}
          <FolderIcon size={92} color="#12287c"  />
         

        {/* Folder name */}
          {folder.name}

      </div>
      
    </div>
  );
};

export const FileItem: React.FC<FileItemProps> = ({ file, onClick, onContextMenu, isDownloading = false }) => {
  const [showShareModal, setShowShareModal] = useState(false);

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

  const fileIconSmall = getFileIcon(file.content_type, file.original_filename, 'small');

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
          handleClick(e as any);
        }
      }}
    >
      <div className={styles.itemContent}>
        {/* Top row: left file icon, right share icon */}
        <div className={styles.topRow}>
          <span className={styles.fileIcon}>{fileIconSmall}</span>
          <button
            aria-label="Share file"
            onClick={handleShareClick}
            className={styles.shareButton}
          >
            <UserPlus size={18} color="#12287c" />
          </button>
        </div>

        {/* File name */}
        <div className={styles.name}>
          {file.original_filename}
        </div>

        {/* Avatar + owner name (if available) */}
        <div className={styles.ownerRow}>
          <Avatar name={(file as any).ownerName || ''} size="24" round={true} textSizeRatio={2.4} />
          <span className={styles.ownerName}>
            {(file as any).ownerName || '—'}
          </span>
          {isDownloading && <span className={styles.downloadingText}>(Downloading...)</span>}
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