import React, { useState, useEffect, useMemo } from 'react';
import { DataTable, SearchInput, PriorityFilters, ColumnToggle } from 'shyftlabs-dsl';
import { 
  ContentFile, 
  Folder, 
  LibraryViewMode, 
  LibraryFilters,
  FileUploadProgress 
} from '@/types/content-library';
import { 
  getFiles, 
  getFolders,
  getFolderContents,
  deleteFile, 
  formatFileSize, 
  formatDate, 
  getFileIcon 
} from '@/services/content-library/content-library.service';
import { 
  DownloadIcon, 
  TrashIcon, 
  EditIcon, 
  EyeIcon,
  UploadIcon,
  GridIcon,
  ListIcon,
  SortAscIcon,
  SortDescIcon
} from 'lucide-react';
import { Button } from 'shyftlabs-dsl';
import useAlert from '@/contexts/alert/alert.hook';
import { AlertVariant } from '@/contexts/alert/alert.provider';
import styles from '../styles/file-list.module.scss';

interface FileListProps {
  currentFolder: Folder | null;
  onFileSelect?: (file: ContentFile) => void;
  onFileEdit?: (file: ContentFile) => void;
  onFileDelete?: (file: ContentFile) => void;
  onFolderSelect?: (folder: Folder) => void;
  onUploadClick?: () => void;
  refreshTrigger?: number;
}

type FileRow = {
  id: string;
  name: string;
  type: 'file' | 'folder';
  originalFilename: string;
  fileSize: string;
  contentType: string;
  createdAt: string;
  updatedAt: string;
  allowAllBrands: string;
  brandAccess: string;
};

const FileList: React.FC<FileListProps> = ({
  currentFolder,
  onFileSelect,
  onFileEdit,
  onFileDelete,
  onFolderSelect,
  onUploadClick,
  refreshTrigger,
}) => {
  const [files, setFiles] = useState<ContentFile[]>([]);
  const [subfolders, setSubfolders] = useState<Folder[]>([]);
  const [summary, setSummary] = useState<{
    totalFolders: number;
    totalFiles: number;
    totalItems: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<LibraryViewMode>({
    type: 'list',
    sortBy: 'name',
    sortOrder: 'asc',
  });
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  const { showAlert } = useAlert();

  const loadContent = async () => {
    try {
      setLoading(true);
      
      console.log('Loading content for currentFolder:', currentFolder);
      
      // Use the new folder contents API that returns both folders and files in one call
      const response = await getFolderContents(currentFolder?.id);
      
      console.log('API Response:', response);
      console.log('API Response data:', response.data);
      console.log('API Response data keys:', Object.keys(response.data || {}));
      
      if (response.status === 'success') {
        // Handle different response structures for /files/all vs /folders/{id}/contents
        let files = [];
        let folders = [];
        let summary = null;
        
        if (currentFolder === null) {
          // For "All Files" - /files/all endpoint
          // Response structure: { data: { items: [...] } }
          const items = response.data?.items || [];
          console.log('All Files - Raw items:', items);
          console.log('All Files - Items with type field:', items.map((item: any) => ({ id: item.id, name: item.name, type: item.type })));
          
          files = items.filter((item: any) => item.type === 'file');
          folders = items.filter((item: any) => item.type === 'folder');
          
          console.log('All Files - Filtered files:', files);
          console.log('All Files - Filtered folders:', folders);
          
          summary = {
            totalFiles: files.length,
            totalFolders: folders.length,
            totalItems: items.length
          };
        } else {
          // For specific folder - /folders/{id}/contents endpoint
          // Response structure: { data: { contents: { files: [...], folders: [...] }, summary: {...} } }
          files = response.data?.contents?.files || [];
          folders = []; // Don't show subfolders when inside a folder - only show files
          summary = {
            totalFiles: files.length,
            totalFolders: 0,
            totalItems: files.length
          };
        }
        
        setFiles(files);
        setSubfolders(folders);
        setSummary(summary);
        
        console.log('Loaded content:', {
          currentFolder: currentFolder?.name || 'All Files',
          folders: folders.length,
          files: files.length,
          summary,
          foldersData: folders,
          filesData: files
        });
      } else {
        showAlert(response.message || 'Failed to load folder contents', AlertVariant.ERROR);
      }
    } catch (error) {
      console.error('Error loading content:', error);
      showAlert('Failed to load content', AlertVariant.ERROR);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, [currentFolder, refreshTrigger]);

  const handleDeleteFile = async (file: ContentFile) => {
    if (window.confirm(`Are you sure you want to delete "${file.name}"?`)) {
      try {
        const response = await deleteFile(file.id);
        if (response.status === 'success') {
          showAlert('File deleted successfully', AlertVariant.SUCCESS);
          loadContent();
          onFileDelete?.(file);
        } else {
          showAlert(response.message || 'Failed to delete file', AlertVariant.ERROR);
        }
      } catch (error) {
        console.error('Error deleting file:', error);
        showAlert('Failed to delete file', AlertVariant.ERROR);
      }
    }
  };

  const handleDownloadFile = async (file: ContentFile) => {
    try {
      // This would typically trigger a download
      const url = file.fileUrl || `/api/files/${file.id}/download`;
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error downloading file:', error);
      showAlert('Failed to download file', AlertVariant.ERROR);
    }
  };

  const rows = useMemo<FileRow[]>(() => {
    // Ensure we have arrays to work with
    const safeSubfolders = Array.isArray(subfolders) ? subfolders : [];
    const safeFiles = Array.isArray(files) ? files : [];

    console.log('Generating rows - subfolders:', safeSubfolders.length, 'files:', safeFiles.length);
    console.log('Subfolders data:', safeSubfolders);
    console.log('Files data:', safeFiles);

    const folderRows: FileRow[] = safeSubfolders.map((folder: Folder) => ({
      id: `folder-${folder.id}`,
      name: folder.name,
      type: 'folder' as const,
      originalFilename: '-',
      fileSize: '-',
      contentType: 'folder',
      createdAt: formatDate(folder.createdAt),
      updatedAt: formatDate(folder.updatedAt),
      allowAllBrands: folder.allowAllBrands ? 'Yes' : 'No',
      brandAccess: folder.brandAccess?.map(ba => ba.brand_name).join(', ') || 'All Brands',
    }));

    const fileRows: FileRow[] = safeFiles.map((file: ContentFile) => ({
      id: `file-${file.id}`,
      name: file.name,
      type: 'file' as const,
      originalFilename: file.originalFilename,
      fileSize: file.fileSize ? formatFileSize(file.fileSize) : 'Unknown',
      contentType: file.contentType || 'Unknown',
      createdAt: formatDate(file.createdAt),
      updatedAt: formatDate(file.updatedAt),
      allowAllBrands: file.allowAllBrands ? 'Yes' : 'No',
      brandAccess: file.brandAccess?.map(ba => ba.brand_name).join(', ') || 'All Brands',
    }));

    // Combine folders and files, with folders first
    const combinedRows = [...folderRows, ...fileRows];
    console.log('Final rows generated:', combinedRows.length, 'rows:', combinedRows);
    return combinedRows;
  }, [files, subfolders]);

  type CellArgs = { row: { original: FileRow } };
  const columns: Array<{ 
    header: string; 
    accessorKey: keyof FileRow; 
    cell?: (args: CellArgs) => React.ReactElement;
    sortable?: boolean;
  }> = [
    {
      header: 'Name',
      accessorKey: 'name',
      sortable: true,
      cell: ({ row }) => {
        const isFolder = row.original.type === 'folder';
        const icon = isFolder ? '📁' : '📄';
        
        const handleClick = () => {
          if (isFolder) {
            // For folders, we need to find the actual folder object to pass to onFolderSelect
            const safeSubfolders = Array.isArray(subfolders) ? subfolders : [];
            const folderId = parseInt(row.original.id.replace('folder-', ''));
            const folder = safeSubfolders.find(f => f.id === folderId);
            if (folder) {
              console.log('Folder clicked:', folder);
              onFolderSelect?.(folder);
            }
          } else {
            // For files, we need to find the actual file object to pass to onFileSelect
            const safeFiles = Array.isArray(files) ? files : [];
            const fileId = parseInt(row.original.id.replace('file-', ''));
            const file = safeFiles.find(f => f.id === fileId);
            if (file) {
              onFileSelect?.(file);
            }
          }
        };
        
        return (
          <div className={styles.fileNameCell}>
            <span className={styles.fileIcon}>{icon}</span>
            <div className={styles.fileInfo}>
              <div 
                className={styles.fileName}
                onClick={handleClick}
                style={{ cursor: 'pointer' }}
              >
                {row.original.name}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Type',
      accessorKey: 'type',
      sortable: true,
      cell: ({ row }) => (
        <span className={styles.typeCell}>
          {row.original.type === 'folder' ? 'Folder' : 'File'}
        </span>
      ),
    },
    { 
      header: 'Size', 
      accessorKey: 'fileSize',
      sortable: true,
    },
    { 
      header: 'Content Type', 
      accessorKey: 'contentType',
      sortable: true,
    },
    { 
      header: 'Created', 
      accessorKey: 'createdAt',
      sortable: true,
    },
    { 
      header: 'Modified', 
      accessorKey: 'updatedAt',
      sortable: true,
    },
    { 
      header: 'Brand Access', 
      accessorKey: 'brandAccess',
    },
    {
      header: 'Actions',
      accessorKey: 'id',
      cell: ({ row }) => {
        const isFolder = row.original.type === 'folder';
        
        if (isFolder) {
          // For folders, show limited actions
          return (
            <div className={styles.actions}>
              <button
                className={styles.actionButton}
                onClick={() => {
                  const safeSubfolders = Array.isArray(subfolders) ? subfolders : [];
                  const folderId = parseInt(row.original.id.replace('folder-', ''));
                  const folder = safeSubfolders.find(f => f.id === folderId);
                  if (folder) {
                    onFolderSelect?.(folder);
                  }
                }}
                title="Open Folder"
              >
                <EyeIcon size={16} />
              </button>
            </div>
          );
        } else {
          // For files, show all actions
          return (
            <div className={styles.actions}>
              <button
                className={styles.actionButton}
                onClick={() => {
                  const safeFiles = Array.isArray(files) ? files : [];
                  const fileId = parseInt(row.original.id.replace('file-', ''));
                  const file = safeFiles.find(f => f.id === fileId);
                  if (file) {
                    onFileEdit?.(file);
                  }
                }}
                title="Edit"
              >
                <EditIcon size={16} />
              </button>
              <button
                className={styles.actionButton}
                onClick={() => {
                  const safeFiles = Array.isArray(files) ? files : [];
                  const fileId = parseInt(row.original.id.replace('file-', ''));
                  const file = safeFiles.find(f => f.id === fileId);
                  if (file) {
                    handleDownloadFile(file);
                  }
                }}
                title="Download"
              >
                <DownloadIcon size={16} />
              </button>
              <button
                className={styles.actionButton}
                onClick={() => {
                  const safeFiles = Array.isArray(files) ? files : [];
                  const fileId = parseInt(row.original.id.replace('file-', ''));
                  const file = safeFiles.find(f => f.id === fileId);
                  if (file) {
                    handleDeleteFile(file);
                  }
                }}
                title="Delete"
              >
                <TrashIcon size={16} />
              </button>
            </div>
          );
        }
      },
    },
  ];

  const visibleColumns = useMemo(() => {
    console.log('Column visibility check:', {
      columnVisibility,
      columnVisibilityKeys: Object.keys(columnVisibility || {}),
      columnsLength: columns.length,
      columns: columns.map(c => ({ header: c.header, accessorKey: c.accessorKey }))
    });
    
    if (!columnVisibility || Object.keys(columnVisibility).length === 0) {
      console.log('No column visibility set, returning all columns');
      return columns;
    }
    
    const filtered = columns.filter((c) => columnVisibility[c.accessorKey] !== false);
    console.log('Filtered columns:', filtered.length, filtered.map(c => ({ header: c.header, accessorKey: c.accessorKey })));
    return filtered;
  }, [columns, columnVisibility]);

  // Debug DataTable props
  useEffect(() => {
    console.log('DataTable props:', {
      loading,
      rowsLength: rows.length,
      rows: rows,
      visibleColumnsLength: visibleColumns.length,
      visibleColumns: visibleColumns.map(c => ({ header: c.header, accessorKey: c.accessorKey }))
    });
  }, [loading, rows, visibleColumns]);

  const handleColumnVisibilityChange = (
    updaterOrValue: ((prev: Record<string, boolean>) => Record<string, boolean>) | Record<string, boolean>
  ) => {
    if (typeof updaterOrValue === 'function') {
      const fn = updaterOrValue as (prev: Record<string, boolean>) => Record<string, boolean>;
      setColumnVisibility((prev: Record<string, boolean>) => fn(prev));
    } else {
      setColumnVisibility(updaterOrValue as Record<string, boolean>);
    }
  };

  const handleSort = (column: string, order: 'asc' | 'desc') => {
    setViewMode(prev => ({
      ...prev,
      sortBy: column as 'name' | 'created_at' | 'updated_at' | 'size',
      sortOrder: order,
    }));
  };

  return (
    <div className={styles.fileList}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.breadcrumb}>
            <button 
              className={styles.breadcrumbItem}
              onClick={() => onFolderSelect?.(null as any)}
            >
              All Files
            </button>
            {currentFolder && (
              <>
                <span className={styles.breadcrumbSeparator}>/</span>
                <span className={styles.breadcrumbCurrent}>
                  {currentFolder.name}
                </span>
              </>
            )}
          </div>
          <h3>
            {currentFolder ? currentFolder.name : 'All Files'}
          </h3>
          {summary && (
            <div className={styles.summary}>
              {currentFolder === null ? (
                <>
                  {summary.totalFolders} folder{summary.totalFolders !== 1 ? 's' : ''}, {summary.totalFiles} file{summary.totalFiles !== 1 ? 's' : ''}
                </>
              ) : (
                <>
                  {summary.totalFiles} file{summary.totalFiles !== 1 ? 's' : ''}
                </>
              )}
            </div>
          )}
        </div>
        
        <div className={styles.headerRight}>
          <div className={styles.viewControls}>
            <button
              className={`${styles.viewButton} ${viewMode.type === 'list' ? styles.active : ''}`}
              onClick={() => setViewMode(prev => ({ ...prev, type: 'list' }))}
              title="List View"
            >
              <ListIcon size={16} />
            </button>
            <button
              className={`${styles.viewButton} ${viewMode.type === 'grid' ? styles.active : ''}`}
              onClick={() => setViewMode(prev => ({ ...prev, type: 'grid' }))}
              title="Grid View"
            >
              <GridIcon size={16} />
            </button>
          </div>
          
          <Button
            variant="primary"
            size="small"
            icon={<UploadIcon />}
            onClick={onUploadClick}
          >
            Upload Files
          </Button>
        </div>
      </div>

      <div className={styles.filters}>
        <SearchInput
          initialValue={search}
          onSearch={(val) => {
            setSearch(val);
            setPageNo(1);
          }}
          placeholder="Search files..."
        />
        
        <div className={styles.filterControls}>
          <ColumnToggle
            columns={columns}
            enableColumnHiding
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={handleColumnVisibilityChange}
          />
        </div>
      </div>

      <div className={styles.tableContainer}>
        <DataTable
          loading={loading}
          columns={visibleColumns}
          data={rows}
          fallback={{ 
            title: 'None', 
            description: currentFolder 
              ? 'This folder has no files. Upload files to get started.'
              : 'No files or folders found. Upload files to get started.'
          }}
          pagination={{
            pageNo: pageNo,
            pageSize: pageSize,
            totalCount: (Array.isArray(files) ? files.length : 0) + (Array.isArray(subfolders) ? subfolders.length : 0),
            sort: [{ id: viewMode.sortBy, desc: viewMode.sortOrder === 'desc' }],
          }}
          onPaginationChange={(nextPageNo, nextPageSize) => {
            setPageNo(Number(nextPageNo));
            setPageSize(Number(nextPageSize));
          }}
        />
      </div>
    </div>
  );
};

export default FileList;
