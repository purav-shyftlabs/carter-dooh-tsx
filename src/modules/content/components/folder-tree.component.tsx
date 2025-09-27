import React, { useState, useEffect } from 'react';
import { ChevronRightIcon, ChevronDownIcon, FolderIcon, FolderOpenIcon } from 'lucide-react';
import { Folder, FolderTreeNode } from '@/types/content-library';
import { getFolders } from '@/services/content-library/content-library.service';
import styles from '../styles/folder-tree.module.scss';

interface FolderTreeProps {
  selectedFolderId?: number;
  onFolderSelect: (folder: Folder | null) => void;
  onFolderCreate?: (parentId: number | null) => void;
  onFolderEdit?: (folder: Folder) => void;
  onFolderDelete?: (folder: Folder) => void;
  expandedFolders?: Set<number>;
  onExpandedFoldersChange?: (expanded: Set<number>) => void;
  refreshTrigger?: number;
}

const FolderTree: React.FC<FolderTreeProps> = ({
  selectedFolderId,
  onFolderSelect,
  onFolderCreate,
  onFolderEdit,
  onFolderDelete,
  expandedFolders = new Set(),
  onExpandedFoldersChange,
  refreshTrigger,
}) => {
  const [folders, setFolders] = useState<FolderTreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildFolderTree = (flatFolders: Folder[]): FolderTreeNode[] => {
    const folderMap = new Map<number, FolderTreeNode>();
    const rootFolders: FolderTreeNode[] = [];

    // First pass: create all folder nodes
    flatFolders.forEach(folder => {
      const folderNode: FolderTreeNode = {
        ...folder,
        id: Number(folder.id), // Convert string ID to number if needed
        parentId: folder.parentId ? Number(folder.parentId) : null, // Use new API field name
        children: [],
        isExpanded: expandedFolders.has(Number(folder.id)),
        level: 0,
      };
      folderMap.set(folderNode.id, folderNode);
    });

    // Second pass: build the tree structure
    flatFolders.forEach(folder => {
      const folderId = Number(folder.id);
      const folderNode = folderMap.get(folderId)!;
      
      if (folder.parentId === null) {
        // Root folder
        folderNode.level = 0;
        rootFolders.push(folderNode);
      } else {
        // Child folder
        const parentId = Number(folder.parentId);
        const parentNode = folderMap.get(parentId);
        if (parentNode) {
          folderNode.level = (parentNode.level || 0) + 1;
          parentNode.children?.push(folderNode);
        } else {
          // Parent not found, treat as root
          folderNode.level = 0;
          rootFolders.push(folderNode);
        }
      }
    });

    return rootFolders;
  };

  const loadFolders = async (parentId: number | null = null) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading folders for parentId:', parentId);
      
      // Always load all folders to build the complete tree
      const response = await getFolders();
      
      if (response.status === 'success') {
        console.log('Loaded all folders:', response.data);
        const folderTree = buildFolderTree(response.data);
        console.log('Built folder tree:', folderTree);
        setFolders(folderTree);
      } else {
        setError(response.message || 'Failed to load folders');
      }
    } catch (err) {
      setError('Failed to load folders');
      console.error('Error loading folders:', err);
    } finally {
      setLoading(false);
    }
  };


  const toggleFolder = async (folder: FolderTreeNode) => {
    const newExpanded = new Set(expandedFolders);
    
    if (expandedFolders.has(folder.id)) {
      newExpanded.delete(folder.id);
    } else {
      newExpanded.add(folder.id);
      // Load children if not already loaded
      if (!folder.children || folder.children.length === 0) {
        await loadFolders(folder.id);
      }
    }
    
    onExpandedFoldersChange?.(newExpanded);
  };

  const handleFolderClick = (folder: FolderTreeNode) => {
    onFolderSelect(folder);
  };

  const handleRootClick = () => {
    onFolderSelect(null);
  };

  const renderFolder = (folder: FolderTreeNode) => {
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;
    const hasChildren = folder.children && folder.children.length > 0;
    
    console.log(`Rendering folder: ${folder.name} (ID: ${folder.id}), expanded: ${isExpanded}, hasChildren: ${hasChildren}, children:`, folder.children);

    const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (onFolderCreate) {
        onFolderCreate(folder.id);
      }
    };

    return (
      <div key={folder.id} className={styles.folderNode}>
        <div
          className={`${styles.folderItem} ${isSelected ? styles.selected : ''}`}
          style={{ paddingLeft: `${(folder.level || 0) * 20 + 8}px` }}
          onClick={() => handleFolderClick(folder)}
          onContextMenu={handleContextMenu}
        >
          <div className={styles.folderIcon}>
            {hasChildren ? (
              <button
                className={styles.expandButton}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolder(folder);
                }}
              >
                {isExpanded ? <ChevronDownIcon size={16} /> : <ChevronRightIcon size={16} />}
              </button>
            ) : (
              <div className={styles.expandSpacer} />
            )}
            {isExpanded ? <FolderOpenIcon size={16} /> : <FolderIcon size={16} />}
          </div>
          <span className={styles.folderName}>{folder.name}</span>
          {onFolderCreate && (
            <button
              className={styles.addSubFolderButton}
              onClick={(e) => {
                e.stopPropagation();
                console.log('Creating sub-folder for folder ID:', folder.id, 'Name:', folder.name);
                onFolderCreate(folder.id);
              }}
              title="Create Sub-folder"
            >
              +
            </button>
          )}
        </div>
        
        {isExpanded && folder.children && (
          <div className={styles.children}>
            {folder.children.map(child => renderFolder(child))}
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    loadFolders();
  }, []);

  useEffect(() => {
    if (refreshTrigger !== undefined) {
      loadFolders();
    }
  }, [refreshTrigger]);

  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <button onClick={() => loadFolders()} className={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  console.log('Current folders state:', folders);
  console.log('Expanded folders:', expandedFolders);

  return (
    <div className={styles.folderTree}>
      <div className={styles.header}>
        <h3>Folders</h3>
        {onFolderCreate && (
          <button
            className={styles.addButton}
            onClick={() => onFolderCreate(null)}
            title="Create Root Folder"
          >
            +
          </button>
        )}
      </div>
      
      <div className={styles.treeContent}>
        <div
          className={`${styles.rootItem} ${selectedFolderId === null ? styles.selected : ''}`}
          onClick={handleRootClick}
        >
          <FolderIcon size={16} />
          <span>All Files</span>
        </div>
        
        {loading ? (
          <div className={styles.loading}>Loading folders...</div>
        ) : (
          <div className={styles.folders}>
            {folders.map(folder => renderFolder(folder))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FolderTree;
