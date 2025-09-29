// Folder and File Management Types

export interface Folder {
  id: number | string;
  name: string;
  parent_id: number | null;
  account_id: number | string;
  owner_id: number | string;
  ownerName?: string; // optional: populated by API for display only
  allow_all_brands: boolean;
  status?: string;
  description?: string;
  brandAccess?: number[];
  createdAt?: string;
  updatedAt?: string;
}

export interface File {
  id: number | string;
  name: string;
  original_filename: string;
  folder_id: number | null;
  folderName?: string; // optional, for UI convenience
  account_id: number | string;
  owner_id: number | string;
  storage_key: string;
  file_size: number | string;
  content_type: string;
  allow_all_brands: boolean;
  status?: string;
  description?: string;
  brandAccess?: number[];
  metadata: {
    originalName: string;
    uploadedAt: string;
    storageProvider: string;
  };
  createdAt?: string;
  updatedAt?: string;
  fileUrl?: string;
}

export interface FolderWithContents extends Folder {
  subfolders: Folder[];
  files: File[];
}

export interface CreateFolderRequest {
  name: string;
  parentId?: number | null;
  allowAllBrands: boolean;
  selectedBrands?: number[];
  status?: string;
  description?: string;
}

export interface UploadFileRequest {
  fileData: string; // base64 encoded
  filename: string;
  mimeType?: string;
  folderId?: number | null;
  allowAllBrands: boolean;
  selectedBrands?: number[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface HierarchyResponse {
  folders: Folder[];
  files: File[];
}

export interface AllItemsResponse {
  items: Array<{
    id: number;
    name: string;
    type: 'folder' | 'file';
    parentId?: number | null;
    parentName?: string;
    folderId?: number | null;
    folderName?: string;
    accountId: number;
    ownerId: number;
    allowAllBrands: boolean;
    createdAt: string;
    updatedAt: string;
    // File-specific properties
    originalFilename?: string;
    fileSize?: number;
    contentType?: string;
    fileUrl?: string;
  }>;
  summary: {
    totalFolders: number;
    totalFiles: number;
    totalItems: number;
  };
}

export interface BreadcrumbItem {
  id: number | null;
  name: string;
  path: string;
}

export interface FileUploadProgress {
  file: globalThis.File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface Brand {
  id: number;
  name: string;
  description?: string;
}
