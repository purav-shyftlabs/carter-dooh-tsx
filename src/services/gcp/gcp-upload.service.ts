import api from '../api/api-client';
import gcpSignedUrlService from './gcp-signed-url.service';

interface GCPUploadResponse {
  success: boolean;
  message: string;
  data: {
    url: string;
  };
  timestamp: string;
}

class GCPUploadService {
  private uploadUrl = '/gcp/upload';

  /**
   * Upload file using existing GCP upload service
   * @param file - The file to upload
   * @returns Promise<string> - The uploaded file URL
   */
  async uploadFile(file: globalThis.File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<GCPUploadResponse>(this.uploadUrl, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to upload file to GCP');
    }

    return response.data.data.url;
  }

  /**
   * Get signed URL for viewing a file (use signed URL service for fetching)
   * @param fileUrl - The file URL in GCP storage
   * @param expirationMinutes - How long the URL should be valid
   * @returns Promise<string> - The signed URL for viewing
   */
  async getViewUrl(fileUrl: string, expirationMinutes: number = 5): Promise<string> {
    return gcpSignedUrlService.getViewUrl(fileUrl, expirationMinutes);
  }

  /**
   * Delete file using signed URL
   * @param fileUrl - The file URL in GCP storage
   * @returns Promise<void>
   */
  async deleteFile(fileUrl: string): Promise<void> {
    return gcpSignedUrlService.deleteFile(fileUrl);
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return gcpSignedUrlService.getCacheStats();
  }

  /**
   * Clear cache
   */
  clearCache() {
    return gcpSignedUrlService.clearCache();
  }
}

export const gcpUploadService = new GCPUploadService();
export default gcpUploadService;
