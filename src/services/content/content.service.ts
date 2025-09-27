import api from '../api/api-client';
import {
  Folder,
  File,
  FolderWithContents,
  CreateFolderRequest,
  UploadFileRequest,
  ApiResponse,
  HierarchyResponse,
  AllItemsResponse,
} from '@/types/folder';
import { getFileIcon } from '@/utils/file-icons';
  
class ContentService {
  private baseUrl = '/folders';
  private filesUrl = '/files';

  // Folder Management APIs
  async createFolder(data: CreateFolderRequest): Promise<ApiResponse<Folder>> {
    const response = await api.post(`${this.baseUrl}`, data);
    return response.data;
  }

  async getFolders(parentId?: number | null): Promise<ApiResponse<Folder[]>> {
    const params = parentId !== undefined ? { parentId } : {};
    const response = await api.get(this.baseUrl, { params });
    return response.data;
  }

  async getFolderWithContents(id: number): Promise<ApiResponse<FolderWithContents>> {
    const response = await api.get(`${this.baseUrl}/${id}`);
    return response.data;
  }

  // File Management APIs
  async uploadFile(data: UploadFileRequest): Promise<ApiResponse<File>> {
    const response = await api.post(`${this.filesUrl}/upload`, data);
    return response.data;
  }

  async getFiles(folderId?: number | null): Promise<ApiResponse<File[]>> {
    const params = folderId !== undefined ? { folderId } : {};
    const response = await api.get(this.filesUrl, { params });
    return response.data;
  }

  async getHierarchy(parentId?: number | null): Promise<ApiResponse<HierarchyResponse>> {
    const params = parentId !== undefined ? { parentId } : {};
    const response = await api.get(`${this.filesUrl}/hierarchy`, { params });
    return response.data;
  }

  async getAllItems(): Promise<ApiResponse<AllItemsResponse>> {
    const response = await api.get(`${this.filesUrl}/all`);
    return response.data;
  }

  // Utility methods
  async deleteFolder(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async deleteFile(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete(`${this.filesUrl}/${id}`);
    return response.data;
  }

  async renameFolder(id: number, name: string): Promise<ApiResponse<Folder>> {
    const response = await api.patch(`${this.baseUrl}/${id}`, { name });
    return response.data;
  }

  async renameFile(id: number, name: string): Promise<ApiResponse<File>> {
    const response = await api.patch(`${this.filesUrl}/${id}`, { name });
    return response.data;
  }

  // Get file URL for serving
  getFileUrl(file: File): string {
    if (file.folder_id) {
      return `/uploads/files/folder/${file.folder_id}/${file.name}`;
    }
    return `/uploads/files/${file.name}`;
  }

  // Download file by ID
  async downloadFile(fileId: number | string, filename?: string): Promise<void> {
    const response = await api.get(`/files/${fileId}/download`, {
      responseType: 'blob'
    });
    
    // Get filename from response headers or use provided filename
    const contentDisposition = response.headers['content-disposition'];
    let downloadFilename = filename;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      if (filenameMatch) {
        downloadFilename = filenameMatch[1];
      }
    }
    
    // Create blob URL and trigger download
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = downloadFilename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // Convert file to base64 for upload
  async fileToBase64(file: globalThis.File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  // Format file size
  formatFileSize(bytes: number | string): string {
    const numBytes = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
    if (numBytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(numBytes) / Math.log(k));
    return parseFloat((numBytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Get file icon based on content type and filename
  getFileIcon(contentType: string, filename?: string) {
    return getFileIcon(contentType, filename);
  }
}

export const contentService = new ContentService();
export default contentService;
