import {
  Folder,
  ContentFile,
  CreateFolderRequest,
  UpdateFolderRequest,
  UpdateFolderBrandAccessRequest,
  CreateFileRequest,
  UpdateFileRequest,
  UpdateFileBrandAccessRequest,
  UploadFileRequest,
  UploadMultipleFilesRequest,
  ApiResponse,
  PaginatedResponse,
  UploadResult,
  LibraryFilters
} from '@/types/content-library';
import api from '@/services/api/api-client';
import axios from 'axios';

// Create a custom axios instance for file uploads without default Content-Type
const uploadApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 60000,
});

// Add auth interceptor for uploads
uploadApi.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Helper function to handle API responses
const handleApiResponse = <T>(response: any): ApiResponse<T> => {
  if (response.data) {
    const apiResponse = response.data;
    // Convert 'success' to 'status' if needed
    if (apiResponse.success !== undefined) {
      return {
        status: apiResponse.success ? 'success' : 'error',
        message: apiResponse.message || 'Request completed',
        data: apiResponse.data,
      };
    }
    return apiResponse;
  }
  return {
    status: 'error',
    message: 'Invalid response format',
    data: null as unknown as T,
  };
};

// Helper function to handle API errors
const handleApiError = <T>(error: any): ApiResponse<T> => {
  if (error.response?.data) {
    const apiResponse = error.response.data;
    // Convert 'success' to 'status' if needed
    if (apiResponse.success !== undefined) {
      return {
        status: apiResponse.success ? 'success' : 'error',
        message: apiResponse.message || 'Request completed',
        data: apiResponse.data,
      };
    }
    return apiResponse;
  }
  return {
    status: 'error',
    message: error.message || 'An error occurred',
    data: null as unknown as T,
  };
};

// Folder Management APIs

export const createFolder = async (data: CreateFolderRequest): Promise<ApiResponse<Folder>> => {
  try {
    console.log('API: Creating folder with data:', JSON.stringify(data, null, 2));
    const response = await api.post('/folders', data);
    console.log('API: Create folder response:', response.data);
    return handleApiResponse<Folder>(response);
  } catch (error) {
    console.error('API: Create folder error:', error);
    return handleApiError<Folder>(error);
  }
};

export const getFolders = async (parentId?: number): Promise<ApiResponse<Folder[]>> => {
  try {
    const params = {
      ...(parentId !== undefined && { parentId }),
    };
    
    console.log('API: Getting folders with params:', params);
    const response = await api.get('/folders', { params });
    console.log('API: Get folders response:', response.data);
    return handleApiResponse<Folder[]>(response);
  } catch (error) {
    console.error('API: Get folders error:', error);
    return handleApiError<Folder[]>(error);
  }
};

export const getFolderById = async (id: number): Promise<ApiResponse<Folder>> => {
  try {
    const response = await api.get(`/folders/${id}`);
    return handleApiResponse<Folder>(response);
  } catch (error) {
    return handleApiError<Folder>(error);
  }
};

export const updateFolder = async (id: number, data: UpdateFolderRequest): Promise<ApiResponse<Folder>> => {
  try {
    const response = await api.patch(`/folders/${id}`, data);
    return handleApiResponse<Folder>(response);
  } catch (error) {
    return handleApiError<Folder>(error);
  }
};

export const deleteFolder = async (id: number): Promise<ApiResponse<Folder>> => {
  try {
    const response = await api.delete(`/folders/${id}`);
    return handleApiResponse<Folder>(response);
  } catch (error) {
    return handleApiError<Folder>(error);
  }
};

export const updateFolderBrandAccess = async (
  id: number,
  data: UpdateFolderBrandAccessRequest
): Promise<ApiResponse<Folder>> => {
  try {
    const response = await api.patch(`/folders/${id}/brand-access`, data);
    return handleApiResponse<Folder>(response);
  } catch (error) {
    return handleApiError<Folder>(error);
  }
};

// File Management APIs

export const createFile = async (data: CreateFileRequest): Promise<ApiResponse<ContentFile>> => {
  try {
    const response = await api.post('/files', data);
    return handleApiResponse<ContentFile>(response);
  } catch (error) {
    return handleApiError<ContentFile>(error);
  }
};

// Test function to debug upload issues
export const testUpload = async (file: File): Promise<void> => {
  console.log('=== TEST UPLOAD START ===');
  
  // Convert react-dropzone file to native File object
  const nativeFile = new File([file], file.name, { type: file.type });
  console.log('Original file:', file);
  console.log('Native file:', nativeFile);
  
  const formData = new FormData();
  formData.append('file', nativeFile);
  formData.append('allowAllBrands', 'true');
  
  console.log('Test FormData entries:');
  Array.from(formData.entries()).forEach(([key, value]) => {
    console.log(`${key}:`, value);
  });
  
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  console.log('Test API URL:', apiUrl);
  console.log('Test token present:', !!token);
  
  try {
    // Try XMLHttpRequest instead of fetch
    const xhr = new XMLHttpRequest();
    
    xhr.open('POST', `${apiUrl}/files/upload`);
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    
    console.log('Sending XHR request...');
    
    // Wait for response
    await new Promise((resolve, reject) => {
      xhr.onload = () => {
        console.log('XHR response status:', xhr.status);
        console.log('XHR response headers:', xhr.getAllResponseHeaders());
        console.log('XHR response body:', xhr.responseText);
        
        if (xhr.status >= 200 && xhr.status < 300) {
          console.log('XHR upload successful!');
          resolve(xhr.responseText);
        } else {
          console.error('XHR upload failed:', xhr.responseText);
          reject(new Error(`XHR failed: ${xhr.status} - ${xhr.responseText}`));
        }
      };
      
      xhr.onerror = () => {
        console.error('XHR upload error:', xhr.statusText);
        reject(new Error(`XHR error: ${xhr.statusText}`));
      };
      
      xhr.send(formData);
    });
    
  } catch (error) {
    console.error('Test upload error:', error);
  }
  
  console.log('=== TEST UPLOAD END ===');
};

export const uploadFile = async (data: UploadFileRequest): Promise<ApiResponse<ContentFile>> => {
  try {
    // Validate file object
    if (!data.file || !(data.file instanceof File)) {
      throw new Error('Invalid file object');
    }

    console.log('File object details:', {
      name: data.file.name,
      size: data.file.size,
      type: data.file.type,
      lastModified: data.file.lastModified,
      constructor: data.file.constructor.name
    });

    // Convert file to base64
    console.log('Converting file to base64...');
    const base64File = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (e.g., "data:image/png;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(data.file);
    });

    // Prepare upload payload
    const uploadPayload = {
      fileData: base64File,
      filename: data.file.name,
      mimeType: data.file.type,
      ...(data.folderId && { folderId: data.folderId }),
      allowAllBrands: data.allowAllBrands,
    };

    console.log('API: Uploading file with payload:', {
      filename: data.file.name,
      fileSize: data.file.size,
      fileType: data.file.type,
      folderId: data.folderId,
      allowAllBrands: data.allowAllBrands,
    });

    const response = await api.post('/files/upload', uploadPayload);
    console.log('API: Upload file response:', response.data);
    
    return handleApiResponse<ContentFile>(response);
  } catch (error) {
    console.error('API: Upload file error:', error);
    return handleApiError<ContentFile>(error);
  }
};

export const uploadMultipleFiles = async (data: UploadMultipleFilesRequest): Promise<ApiResponse<UploadResult>> => {
  try {
    const formData = new FormData();
    
    // Append all files
    data.files.forEach(file => formData.append('files', file));
    
    // Add other parameters
    formData.append('allowAllBrands', data.allowAllBrands.toString());
    if (data.folderId) formData.append('folderId', data.folderId.toString());
    if (data.brandIds && data.brandIds.length > 0) {
      data.brandIds.forEach(id => formData.append('brandIds', id.toString()));
    }

    console.log('API: Uploading multiple files with FormData:', {
      fileCount: data.files.length,
      allowAllBrands: data.allowAllBrands,
      folderId: data.folderId,
      brandIds: data.brandIds,
    });

    // Get auth token
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    // Use fetch API for more reliable FormData handling
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/files/upload-multiple`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
        // Don't set Content-Type - let fetch handle it automatically
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    console.log('API: Upload multiple files response:', responseData);
    
    return handleApiResponse<UploadResult>({ data: responseData });
  } catch (error) {
    console.error('API: Upload multiple files error:', error);
    return handleApiError<UploadResult>(error);
  }
};

export const getFiles = async (folderId?: number): Promise<ApiResponse<ContentFile[]>> => {
  try {
    const params = {
      ...(folderId && { folderId }),
    };
    
    console.log('API: Getting files with params:', params);
    const response = await api.get('/files', { params });
    console.log('API: Get files response:', response.data);
    return handleApiResponse<ContentFile[]>(response);
  } catch (error) {
    console.error('API: Get files error:', error);
    return handleApiError<ContentFile[]>(error);
  }
};

export const getFolderContents = async (folderId?: number): Promise<ApiResponse<any>> => {
  try {
    // For root folder (no folderId), use /files/all
    // For specific folders, use /folders/{FOLDER_ID}/contents
    const url = folderId ? `/folders/${folderId}/contents` : '/files/all';
    console.log('API: Getting folder contents for folderId:', folderId);
    console.log('API: Making request to:', url);
    const response = await api.get(url);
    console.log('API: Get folder contents response:', response.data);
    return handleApiResponse(response);
  } catch (error) {
    console.error('API: Get folder contents error:', error);
    return handleApiError(error);
  }
};

export const getFileById = async (id: number): Promise<ApiResponse<ContentFile>> => {
  try {
    const response = await api.get(`/files/${id}`);
    return handleApiResponse<ContentFile>(response);
  } catch (error) {
    return handleApiError<ContentFile>(error);
  }
};

export const updateFile = async (id: number, data: UpdateFileRequest): Promise<ApiResponse<ContentFile>> => {
  try {
    const response = await api.patch(`/files/${id}`, data);
    return handleApiResponse<ContentFile>(response);
  } catch (error) {
    return handleApiError<ContentFile>(error);
  }
};

export const deleteFile = async (id: number): Promise<ApiResponse<ContentFile>> => {
  try {
    const response = await api.delete(`/files/${id}`);
    return handleApiResponse<ContentFile>(response);
  } catch (error) {
    return handleApiError<ContentFile>(error);
  }
};

export const updateFileBrandAccess = async (
  id: number,
  data: UpdateFileBrandAccessRequest
): Promise<ApiResponse<ContentFile>> => {
  try {
    const response = await api.patch(`/files/${id}/brand-access`, data);
    return handleApiResponse<ContentFile>(response);
  } catch (error) {
    return handleApiError<ContentFile>(error);
  }
};

export const downloadFile = async (id: number): Promise<Blob> => {
  try {
    const response = await api.get(`/files/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to download file');
  }
};

export const serveFile = async (id: number): Promise<Blob> => {
  try {
    const response = await api.get(`/files/${id}/serve`, {
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to serve file');
  }
};

// Combined Library APIs

export const getLibraryContent = async (
  folderId?: number,
  filters?: LibraryFilters
): Promise<ApiResponse<any>> => {
  return getFolderContents(folderId);
};

// Utility functions

export const getFileIcon = (contentType: string): string => {
  if (contentType.startsWith('image/')) return '🖼️';
  if (contentType.startsWith('video/')) return '🎥';
  if (contentType.startsWith('audio/')) return '🎵';
  if (contentType.includes('pdf')) return '📄';
  if (contentType.includes('word')) return '📝';
  if (contentType.includes('excel') || contentType.includes('spreadsheet')) return '📊';
  if (contentType.includes('powerpoint') || contentType.includes('presentation')) return '📈';
  if (contentType.includes('zip') || contentType.includes('rar')) return '📦';
  return '📁';
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
