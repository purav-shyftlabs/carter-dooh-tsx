import api from '../api/api-client';

export interface SignedUrlResponse {
  success: boolean;
  message: string;
  data: {
    signedUrl: string;
    expiresIn: number;
    fileId: string;
    originalFilename: string;
    contentType: string;
  };
  timestamp: string;
}

export interface FileType {
  id: number | string;
  content_type?: string;
  original_filename?: string;
  fileUrl?: string;
}

class SignedUrlService {
  private urlCache = new Map<string, { url: string; expiresAt: number }>();
  private readonly CACHE_BUFFER = 60000; // 1 minute buffer before expiration

  /**
   * Get a signed URL for a file with caching
   * @param fileUrl - The file URL
   * @param expirationMinutes - How long the URL should be valid (default: 5 minutes)
   * @returns Promise<string> - The signed URL
   */
  async getSignedUrl(fileUrl: string, expirationMinutes: number = 5): Promise<string> {
    const cacheKey = `${fileUrl}-${expirationMinutes}`;
    const now = Date.now();
    
    // Check cache first
    const cached = this.urlCache.get(cacheKey);
    if (cached && cached.expiresAt > now + this.CACHE_BUFFER) {
      return cached.url;
    }

    try {
      const response = await api.get<SignedUrlResponse>(`/signed-url`, {
        params: { 
          fileUrl,
          expirationMinutes 
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

  /**
   * Get signed URL for a file object (with fallback to existing fileUrl)
   * @param file - The file object
   * @param expirationMinutes - How long the URL should be valid
   * @returns Promise<string> - The signed URL or fallback URL
   */
  async getFileSignedUrl(file: FileType, expirationMinutes: number = 5): Promise<string> {
    try {
      // Use the file URL for the signed URL request
      if (!file.fileUrl) {
        throw new Error('File URL is required for signed URL generation');
      }
      return await this.getSignedUrl(file.fileUrl, expirationMinutes);
    } catch (error) {
      console.warn('Failed to get signed URL, falling back to direct URL:', error);
      // Fallback to existing fileUrl if signed URL fails
      return file.fileUrl || '';
    }
  }

  /**
   * Preload signed URLs for multiple files
   * @param files - Array of file objects
   * @param expirationMinutes - How long the URLs should be valid
   * @returns Promise<Map<string, string>> - Map of file IDs to signed URLs
   */
  async preloadSignedUrls(files: FileType[], expirationMinutes: number = 5): Promise<Map<string, string>> {
    const urlMap = new Map<string, string>();
    
    // Process files in batches to avoid overwhelming the server
    const batchSize = 10;
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const promises = batch.map(async (file) => {
        try {
          const signedUrl = await this.getFileSignedUrl(file, expirationMinutes);
          urlMap.set(String(file.id), signedUrl);
        } catch (error) {
          console.warn(`Failed to get signed URL for file ${file.id}:`, error);
          // Use fallback URL
          if (file.fileUrl) {
            urlMap.set(String(file.id), file.fileUrl);
          }
        }
      });
      
      await Promise.all(promises);
    }
    
    return urlMap;
  }

  /**
   * Clear expired URLs from cache
   */
  clearExpiredUrls(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    Array.from(this.urlCache.entries()).forEach(([key, value]) => {
      if (value.expiresAt <= now) {
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
    const entries = Array.from(this.urlCache.entries()).map(([key, value]) => ({
      key,
      expiresAt: value.expiresAt,
      isExpired: value.expiresAt <= now
    }));

    return {
      size: this.urlCache.size,
      entries
    };
  }
}

// Create singleton instance
const signedUrlService = new SignedUrlService();

// Auto-cleanup expired URLs every 5 minutes
setInterval(() => {
  signedUrlService.clearExpiredUrls();
}, 5 * 60 * 1000);

export default signedUrlService;
