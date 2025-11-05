import { useState, useEffect, useCallback } from 'react';
import signedUrlService from '@/services/content/signed-url.service';
import { FileType } from '@/services/content/signed-url.service';

interface UseSignedUrlOptions {
  expirationMinutes?: number;
  autoRefresh?: boolean;
  refreshBuffer?: number; // Minutes before expiration to refresh
}

interface UseSignedUrlReturn {
  url: string;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  isExpired: boolean;
}

/**
 * Hook for managing signed URLs with automatic refresh
 */
export const useSignedUrl = (
  file: FileType | null,
  options: UseSignedUrlOptions = {}
): UseSignedUrlReturn => {
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
    if (!file) {
      setUrl('');
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const signedUrl = await signedUrlService.getFileSignedUrl(file, expirationMinutes);
      setUrl(signedUrl);
      
      // Calculate expiration time
      const now = Date.now();
      const expiresIn = expirationMinutes * 60 * 1000; // Convert to milliseconds
      setExpiresAt(now + expiresIn);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load signed URL';
      setError(errorMessage);
      console.error('useSignedUrl error:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [file, expirationMinutes]);

  const refresh = useCallback(async () => {
    await loadSignedUrl();
  }, [loadSignedUrl]);

  // Load URL when file changes
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

/**
 * Hook for managing multiple signed URLs
 */
export const useSignedUrls = (
  files: FileType[],
  options: UseSignedUrlOptions = {}
) => {
  const [urls, setUrls] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadUrls = useCallback(async () => {
    if (files.length === 0) {
      setUrls(new Map());
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const urlMap = await signedUrlService.preloadSignedUrls(files, options.expirationMinutes);
      setUrls(urlMap);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load signed URLs';
      setError(errorMessage);
      console.error('useSignedUrls error:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [files, options.expirationMinutes]);

  useEffect(() => {
    loadUrls();
  }, [loadUrls]);

  const getUrl = useCallback((fileId: string | number) => {
    return urls.get(String(fileId)) || '';
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

export default useSignedUrl;
