import React, { useState, useEffect, useCallback } from 'react';
import { Button, SearchInput, PriorityFilters } from 'shyftlabs-dsl';
import { Folder, File as FileType, BreadcrumbItem } from '@/types/folder';
import { contentService } from '@/services/content/content.service';
import { FolderItem, FileItem } from './folder-item.component';
import { Breadcrumb } from './breadcrumb.component';
import { FileUploadDialog } from './file-upload-dialog.component';
import { CreateFolderDialog } from './create-folder-dialog.component';
import { PlusIcon, UploadIcon, FolderPlusIcon, GridIcon, ListIcon } from '@/lib/icons';
import styles from '../styles/file-manager.module.scss';
import { Folder as FolderIcon } from 'lucide-react';

interface FileManagerProps {
  userType?: string;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'name' | 'date' | 'size' | 'type';

export const FileManager = ({ userType }: FileManagerProps) => {
  // State management
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<FileType[]>([]);
  const [breadcrumbHistory, setBreadcrumbHistory] = useState<Folder[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { id: null, name: 'Root', path: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string | number>>(new Set());
  
  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortDesc, setSortDesc] = useState(false);
  
  // Dialog state
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
  

  // Load folder contents - ONLY direct children
  const loadFolderContents = useCallback(async (folderId: number | null = null) => {
    setLoading(true);
    setError(null);

    try {
      // Get ONLY direct child folders (no grandchildren)
      const foldersResponse = await contentService.getFolders(folderId);
      setFolders(foldersResponse.data);

      // Get ONLY direct child files (no grandchildren)
      const filesResponse = await contentService.getFiles(folderId);
      setFiles(filesResponse.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load folder contents');
    } finally {
      setLoading(false);
    }
  }, []);

  // Update breadcrumbs when navigating
  const updateBreadcrumbs = useCallback((folder: Folder | null, history: Folder[] = []) => {
    if (!folder) {
      setBreadcrumbs([{ id: null, name: 'Root', path: '' }]);
      setBreadcrumbHistory([]);
      return;
    }

    // Build full breadcrumb path
    const breadcrumbItems: BreadcrumbItem[] = [
      { id: null, name: 'Root', path: '' }
    ];

    // Add all parent folders from history
    history.forEach((parentFolder) => {
      breadcrumbItems.push({
        id: Number(parentFolder.id),
        name: parentFolder.name,
        path: `/folder/${parentFolder.id}`
      });
    });

    // Add current folder
    breadcrumbItems.push({
      id: Number(folder.id),
      name: folder.name,
      path: `/folder/${folder.id}`
    });

    setBreadcrumbs(breadcrumbItems);
    setBreadcrumbHistory(history);
  }, []);

  // Navigate to folder
  const navigateToFolder = useCallback((folder: Folder) => {
    setCurrentFolder(folder);
    
    // Add current folder to history if it's not already there
    const newHistory = [...breadcrumbHistory];
    if (currentFolder && !newHistory.some(f => f.id === currentFolder.id)) {
      newHistory.push(currentFolder);
    }
    
    updateBreadcrumbs(folder, newHistory);
    loadFolderContents(Number(folder.id));
  }, [loadFolderContents, updateBreadcrumbs, breadcrumbHistory, currentFolder]);

  // Navigate via breadcrumb
  const navigateToBreadcrumb = useCallback(async (item: BreadcrumbItem) => {
    if (item.id === null) {
      // Navigate to root
      setCurrentFolder(null);
      setBreadcrumbs([{ id: null, name: 'Root', path: '' }]);
      setBreadcrumbHistory([]);
      loadFolderContents(null);
    } else {
      // Find the index of this folder in the breadcrumb path
      const targetIndex = breadcrumbs.findIndex(b => b.id === item.id);
      
      if (targetIndex !== -1) {
        // Truncate history to this point (exclude the target folder itself)
        const truncatedHistory = breadcrumbHistory.slice(0, targetIndex - 1);
        
        // Try to find the folder in current folders or history
        let targetFolder = folders.find(f => f.id === item.id);
        if (!targetFolder) {
          targetFolder = breadcrumbHistory.find(f => f.id === item.id);
        }
        
        if (targetFolder) {
          // Set the target folder as current and load its contents
          setCurrentFolder(targetFolder);
          updateBreadcrumbs(targetFolder, truncatedHistory);
          loadFolderContents(Number(targetFolder.id));
        } else {
          // If folder not found, create a temporary one and load contents
          const tempFolder: Folder = {
            id: item.id,
            name: item.name,
            parent_id: null,
            account_id: '1',
            owner_id: '1',
            allow_all_brands: false
          };
          
          setCurrentFolder(tempFolder);
          updateBreadcrumbs(tempFolder, truncatedHistory);
          loadFolderContents(Number(item.id));
        }
      }
    }
  }, [folders, breadcrumbHistory, breadcrumbs, loadFolderContents, updateBreadcrumbs]);

  // Handle file click - download all files
  const handleFileClick = useCallback(async (file: FileType, event: React.MouseEvent) => {
    // Download all files (no preview)
    setDownloadingFiles(prev => new Set(prev).add(file.id));
    
    try {
      // Download file using the download API with original filename
      await contentService.downloadFile(file.id, file.original_filename);
    } catch (error) {
      console.error('Error downloading file:', error);
      setError('Failed to download file');
    } finally {
      // Remove file from downloading set
      setDownloadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.id);
        return newSet;
      });
    }
  }, []);

  // Handle folder creation
  const handleFolderCreated = useCallback((newFolder: Folder) => {
    setFolders(prev => [...prev, newFolder]);
  }, []);

  // Handle file upload completion
  const handleUploadComplete = useCallback((uploadedFiles: FileType []) => {
    setFiles(prev => [...prev, ...uploadedFiles]);
  }, []);


  // Filter and sort items
  const filteredAndSortedItems = React.useMemo(() => {
    let filteredFolders = folders;
    let filteredFiles = files;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredFolders = folders.filter(folder => 
        folder.name.toLowerCase().includes(query)
      );
      filteredFiles = files.filter(file => 
        file.original_filename.toLowerCase().includes(query)
      );
    }

    // Sort folders
    filteredFolders.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
          break;
        default:
          comparison = a.name.localeCompare(b.name);
      }
      return sortDesc ? -comparison : comparison;
    });

    // Sort files
    filteredFiles.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a?.original_filename?.localeCompare(b?.original_filename);
          break;
        case 'date':
          comparison = new Date(a.metadata?.uploadedAt || 0).getTime() - new Date(b.metadata?.uploadedAt || 0).getTime();
          break;
        case 'size':
          const sizeA = typeof a.file_size === 'string' ? parseInt(a.file_size, 10) : a.file_size;
          const sizeB = typeof b.file_size === 'string' ? parseInt(b.file_size, 10) : b.file_size;
          comparison = sizeA - sizeB;
          break;
        case 'type':
          comparison = a.content_type.localeCompare(b.content_type);
          break;
        default:
          comparison = a?.original_filename?.localeCompare(b?.original_filename);
      }
      return sortDesc ? -comparison : comparison;
    });

    return { folders: filteredFolders, files: filteredFiles };
  }, [folders, files, searchQuery, sortBy, sortDesc]);

  // Load initial data
  useEffect(() => {
    loadFolderContents(null);
  }, [loadFolderContents]);

  const sortOptions = [
    { label: 'Name', value: 'name' },
    { label: 'Date Modified', value: 'date' },
    { label: 'Size', value: 'size' },
    { label: 'Type', value: 'type' },
  ];

  const currentSortOption = sortOptions.find(opt => opt.value === sortBy) || sortOptions[0];

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Breadcrumb items={breadcrumbs} onNavigate={navigateToBreadcrumb} />
        </div>
        <div className={styles.headerRight}>
          <Button
            label="New Folder"
            icon={<FolderPlusIcon />}
            size="small"
            variant="secondary"
            onClick={() => setShowCreateFolderDialog(true)}
          />
          <Button
            label="Upload"
            icon={<UploadIcon />}
            size="small"
            variant="primary"
            onClick={() => setShowUploadDialog(true)}
          />
        </div>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.controlsLeft}>
          <SearchInput
            initialValue={searchQuery}
            onSearch={setSearchQuery}
            placeholder="Search files and folders..."
            className={styles.searchInput}
          />
          <PriorityFilters
            placeholder="Sort by"
            initialValue={currentSortOption}
            onChange={(selected) => {
              if (selected?.value) {
                setSortBy(selected.value as SortOption);
              }
            }}
            mode="single"
            options={sortOptions}
          />
        </div>
        <div className={styles.controlsRight}>
          <div className={styles.viewToggle}>
            <Button
              icon={<GridIcon />}
              size="small"
              variant={viewMode === 'grid' ? 'primary' : 'secondary'}
              onClick={() => setViewMode('grid')}
            />
            <Button
              icon={<ListIcon />}
              size="small"
              variant={viewMode === 'list' ? 'primary' : 'secondary'}
              onClick={() => setViewMode('list')}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>Loading...</p>
          </div>
        ) : error ? (
          <div className={styles.error}>
            <p>Error: {error}</p>
            <Button
              label="Retry"
              variant="secondary"
              onClick={() => loadFolderContents(currentFolder?.id ? Number(currentFolder.id) : null)}
            />
          </div>
        ) : filteredAndSortedItems.folders.length === 0 && filteredAndSortedItems.files.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}><FolderIcon /></div>
            <h3>No files or folders</h3>
            <p>
              {searchQuery 
                ? 'No items match your search criteria'
                : 'This folder is empty. Upload files or create a new folder to get started.'
              }
            </p>
            {!searchQuery && (
              <div className={styles.emptyActions}>
                <Button
                  label="Create Folder"
                  icon={<FolderPlusIcon />}
                  variant="secondary"
                  onClick={() => setShowCreateFolderDialog(true)}
                />
                <Button
                  label="Upload Files"
                  icon={<UploadIcon />}
                  variant="primary"
                  onClick={() => setShowUploadDialog(true)}
                />
              </div>
            )}
          </div>
        ) : (
          <div className={`${styles.items} ${styles[viewMode]}`}>
            {filteredAndSortedItems.folders.map((folder) => (
              <FolderItem
                key={folder.id}
                folder={folder}
                onClick={navigateToFolder}
              />
            ))}
            {filteredAndSortedItems.files.map((file) => (
              <FileItem
                key={file.id}
                file={file}
                onClick={handleFileClick}
                isDownloading={downloadingFiles.has(file.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <FileUploadDialog
        isOpen={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        currentFolder={currentFolder}
        onUploadComplete={handleUploadComplete}
      />

      <CreateFolderDialog
        isOpen={showCreateFolderDialog}
        onClose={() => setShowCreateFolderDialog(false)}
        parentFolder={currentFolder}
        onFolderCreated={handleFolderCreated}
      />

    </div>
  );
};
