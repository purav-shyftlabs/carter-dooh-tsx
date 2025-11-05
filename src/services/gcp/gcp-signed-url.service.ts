import api from '../api/api-client';

export interface SignedUrlResponse {
  success: boolean;
  message: string;
  data: {
    signedUrl: string;
    expiresIn: number;
    filePath: string;
    action: string;
  };
  timestamp: string;
}

export interface GCPFileUploadResponse {
  success: boolean;
  message: string;
  data: {
    filePath: string;
    url: string;
    originalFilename: string;
    fileSize: number;
    contentType: string;
  };
  timestamp: string;
}

class GCPSignedUrlService {
  private urlCache = new Map<string, { url: string; expiresAt: number }>();
  private readonly CACHE_BUFFER = 60000; // 1 minute buffer before expiration

  /**
   * Get signed URL for any file URL
   * @param fileUrl - The file URL in GCP storage
   * @param action - The action (read, write, delete)
   * @param expirationMinutes - How long the URL should be valid (default: 5 minutes)
   * @returns Promise<string> - The signed URL
   */
  async getSignedUrl(
    fileUrl: string, 
    action: 'read' | 'write' | 'delete' = 'read',
    expirationMinutes: number = 5
  ): Promise<string> {
    const cacheKey = `${fileUrl}-${action}-${expirationMinutes}`;
    const now = Date.now();
    
    // Check cache first
    const cached = this.urlCache.get(cacheKey);
    if (cached && cached.expiresAt > now + this.CACHE_BUFFER) {
      return cached.url;
    }

    try {
      const response = await api.get<SignedUrlResponse>('/signed-url', {
        params: { 
          fileUrl,
          expirationMinutes,
          action 
        }
      });

      if (response.data.success && response.data.data.signedUrl) {
        const signedUrl = response.data.data.signedUrl;
        const expiresAt = now + (response.data.data.expiresIn * 1000);
        
        // Cache the URL
        this.urlCache.set(cacheKey, { url: signedUrl, expiresAt });
        
        return signedUrl;
      } else {
        throw new Error(response.data.message || 'Failed to get signed URL');
      }
    } catch (error) {
      console.error('Error getting signed URL:', error);
      throw error;
    }
  }

  // Note: Upload functionality removed - use existing GCP upload service for uploads
  // This service is only for generating signed URLs for viewing/deleting files

  /**
   * Get signed URL for viewing a file
   * @param fileUrl - The file URL in GCP storage
   * @param expirationMinutes - How long the URL should be valid
   * @returns Promise<string> - The signed URL for viewing
   */
  async getViewUrl(fileUrl: string, expirationMinutes: number = 5): Promise<string> {
    return this.getSignedUrl(fileUrl, 'read', expirationMinutes);
  }

  /**
   * Get signed URL for deleting a file
   * @param fileUrl - The file URL in GCP storage
   * @param expirationMinutes - How long the URL should be valid
   * @returns Promise<string> - The signed URL for deletion
   */
  async getDeleteUrl(fileUrl: string, expirationMinutes: number = 5): Promise<string> {
    return this.getSignedUrl(fileUrl, 'delete', expirationMinutes);
  }

  /**
   * Delete file using signed URL
   * @param fileUrl - The file URL in GCP storage
   * @returns Promise<void>
   */
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const deleteUrl = await this.getDeleteUrl(fileUrl);
      
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.statusText}`);
      }

      // Remove from cache
      this.clearFileFromCache(fileUrl);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  /**
   * Clear expired URLs from cache
   */
  clearExpiredUrls(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.urlCache.forEach((value, key) => {
      if (value.expiresAt <= now) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.urlCache.delete(key));
  }

  /**
   * Clear file from cache by file URL
   */
  clearFileFromCache(fileUrl: string): void {
    const keysToDelete: string[] = [];
    this.urlCache.forEach((_, key) => {
      if (key.includes(fileUrl)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.urlCache.delete(key));
  }

  /**
   * Clear all cached URLs
   */
  clearCache(): void {
    this.urlCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: Array<{ key: string; expiresAt: number; isExpired: boolean }> } {
    const now = Date.now();
    const entries: Array<{ key: string; expiresAt: number; isExpired: boolean }> = [];
    
    this.urlCache.forEach((value, key) => {
      entries.push({
        key,
        expiresAt: value.expiresAt,
        isExpired: value.expiresAt <= now
      });
    });

    return {
      size: this.urlCache.size,
      entries
    };
  }
}

// Create singleton instance
const gcpSignedUrlService = new GCPSignedUrlService();

// Auto-cleanup expired URLs every 5 minutes
setInterval(() => {
  gcpSignedUrlService.clearExpiredUrls();
}, 5 * 60 * 1000);

export default gcpSignedUrlService;
