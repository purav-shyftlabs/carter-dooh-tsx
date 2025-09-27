// Content Library Types

export interface Brand {
  id: number;
  name: string;
  logo_url?: string;
  description?: string;
}

export interface Folder {
  id: number;
  name: string;
  parentId: number | null;
  accountId: number;
  ownerId: number;
  allowAllBrands: boolean;
  createdAt: string;
  updatedAt: string;
  subfolders?: Folder[];
  files?: ContentFile[];
  brandAccess?: BrandAccess[];
}

export interface ContentFile {
  id: number;
  name: string;
  originalFilename: string;
  folderId: number | null;
  accountId: number;
  ownerId: number;
  storageKey: string;
  fileSize: number;
  contentType: string;
  allowAllBrands: boolean;
  metadata: {
    originalName: string;
    uploadedAt: string;
    storageProvider: string;
  };
  createdAt: string;
  updatedAt: string;
  fileUrl?: string;
  brandAccess?: BrandAccess[];
}

export interface BrandAccess {
  folder_id?: number;
  file_id?: number;
  brand_id: number;
  brand_name: string;
}

export interface CreateFolderRequest {
  name: string;
  parentId: number | null;
  allowAllBrands: boolean;
  brandIds: number[];
}

export interface UpdateFolderRequest {
  name?: string;
  parentId?: number;
  allowAllBrands?: boolean;
}

export interface UpdateFolderBrandAccessRequest {
  allowAllBrands: boolean;
  brandIds?: number[];
}

export interface CreateFileRequest {
  name: string;
  folderId?: number;
  originalFilename?: string;
  metadata?: Record<string, unknown>;
  allowAllBrands: boolean;
  brandIds?: number[];
}

export interface UpdateFileRequest {
  name?: string;
  folderId?: number;
  metadata?: Record<string, unknown>;
}

export interface UpdateFileBrandAccessRequest {
  allowAllBrands: boolean;
  brandIds?: number[];
}

export interface UploadFileRequest {
  file: File;
  folderId?: number;
  allowAllBrands: boolean;
  brandIds?: number[];
}

export interface UploadMultipleFilesRequest {
  files: File[];
  folderId?: number;
  allowAllBrands: boolean;
  brandIds?: number[];
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UploadResult {
  uploaded: ContentFile[];
  errors: Array<{
    filename: string;
    error: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

export interface FolderTreeNode extends Folder {
  children?: FolderTreeNode[];
  isExpanded?: boolean;
  level?: number;
}

export interface FileUploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface LibraryViewMode {
  type: 'grid' | 'list';
  sortBy: 'name' | 'created_at' | 'updated_at' | 'size';
  sortOrder: 'asc' | 'desc';
}

export interface LibraryFilters {
  search?: string;
  fileType?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  brandIds?: number[];
  allowAllBrands?: boolean;
}
