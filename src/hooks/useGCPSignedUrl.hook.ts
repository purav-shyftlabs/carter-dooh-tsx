import { useState, useEffect, useCallback } from 'react';
import gcpSignedUrlService from '@/services/gcp/gcp-signed-url.service';

interface UseGCPSignedUrlOptions {
  expirationMinutes?: number;
  autoRefresh?: boolean;
  refreshBuffer?: number; // Minutes before expiration to refresh
}

interface UseGCPSignedUrlReturn {
  url: string;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  isExpired: boolean;
}

/**
 * Hook for managing GCP signed URLs with automatic refresh
 */
export const useGCPSignedUrl = (
  filePath: string | null,
  action: 'read' | 'write' | 'delete' = 'read',
  options: UseGCPSignedUrlOptions = {}
): UseGCPSignedUrlReturn => {
  const {
    expirationMinutes = 5,
    autoRefresh = true,
    refreshBuffer = 1 // Refresh 1 minute before expiration
  } = options;

  const [url, setUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number>(0);

  const loadSignedUrl = useCallback(async () => {
    if (!filePath) {
      setUrl('');
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const signedUrl = await gcpSignedUrlService.getSignedUrl(filePath, action, expirationMinutes);
      setUrl(signedUrl);
      
      // Calculate expiration time
      const now = Date.now();
      const expiresIn = expirationMinutes * 60 * 1000; // Convert to milliseconds
      setExpiresAt(now + expiresIn);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load signed URL';
      setError(errorMessage);
      console.error('useGCPSignedUrl error:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filePath, action, expirationMinutes]);

  const refresh = useCallback(async () => {
    await loadSignedUrl();
  }, [loadSignedUrl]);

  // Load URL when filePath changes
  useEffect(() => {
    loadSignedUrl();
  }, [loadSignedUrl]);

  // Auto-refresh before expiration
  useEffect(() => {
    if (!autoRefresh || !expiresAt) return;

    const now = Date.now();
    const refreshTime = expiresAt - (refreshBuffer * 60 * 1000);
    const timeUntilRefresh = Math.max(0, refreshTime - now);

    const timeoutId = setTimeout(() => {
      loadSignedUrl();
    }, timeUntilRefresh);

    return () => clearTimeout(timeoutId);
  }, [autoRefresh, expiresAt, refreshBuffer, loadSignedUrl]);

  const isExpired = expiresAt > 0 && Date.now() >= expiresAt;

  return {
    url,
    loading,
    error,
    refresh,
    isExpired
  };
};

// Note: Upload hook removed - use existing GCP upload service for uploads
// This hook is only for generating signed URLs for viewing files

/**
 * Hook for managing multiple GCP signed URLs
 */
export const useGCPSignedUrls = (
  filePaths: string[],
  action: 'read' | 'write' | 'delete' = 'read',
  options: UseGCPSignedUrlOptions = {}
) => {
  const [urls, setUrls] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadUrls = useCallback(async () => {
    if (filePaths.length === 0) {
      setUrls(new Map());
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const urlMap = new Map<string, string>();
      
      // Process files in batches to avoid overwhelming the server
      const batchSize = 10;
      for (let i = 0; i < filePaths.length; i += batchSize) {
        const batch = filePaths.slice(i, i + batchSize);
        const promises = batch.map(async (filePath) => {
          try {
            const signedUrl = await gcpSignedUrlService.getSignedUrl(filePath, action, options.expirationMinutes);
            urlMap.set(filePath, signedUrl);
          } catch (err) {
            console.warn(`Failed to get signed URL for ${filePath}:`, err);
          }
        });
        
        await Promise.all(promises);
      }
      
      setUrls(urlMap);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load signed URLs';
      setError(errorMessage);
      console.error('useGCPSignedUrls error:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filePaths, action, options.expirationMinutes]);

  useEffect(() => {
    loadUrls();
  }, [loadUrls]);

  const getUrl = useCallback((filePath: string) => {
    return urls.get(filePath) || '';
  }, [urls]);

  const refresh = useCallback(async () => {
    await loadUrls();
  }, [loadUrls]);

  return {
    urls,
    getUrl,
    loading,
    error,
    refresh
  };
};

export default useGCPSignedUrl;
