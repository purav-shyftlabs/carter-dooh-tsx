import api from '../api/api-client';

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
}

export const gcpUploadService = new GCPUploadService();
export default gcpUploadService;
