import { useState, useEffect } from 'react';
import { Brand } from '@/types/folder';
import { brandsService } from '@/services/brands/brands.service';
import { contentService } from '@/services/content/content.service';

export const useBrands = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try brands service first
      let brandsData: Brand[] = [];
      try {
        const result = await brandsService.getBrands(); // No params = returns Brand[]
        console.log('useBrands hook - brandsService result:', result); // Debug log
        brandsData = Array.isArray(result) ? result : [];
      } catch (brandsServiceError) {
        console.warn('Brands service failed, trying content service:', brandsServiceError);
        
        // Fallback to content service
        try {
          const contentResult = await contentService.getBrands();
          console.log('useBrands hook - contentService result:', contentResult); // Debug log
          brandsData = Array.isArray(contentResult.data) ? contentResult.data : [];
        } catch (contentServiceError) {
          console.error('Both services failed:', contentServiceError);
          throw contentServiceError;
        }
      }
      
      console.log('useBrands hook - final brands array:', brandsData); // Debug log
      setBrands(brandsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch brands');
      console.error('Error fetching brands:', err);
      // Set empty array on error to prevent crashes
      setBrands([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  return {
    brands,
    loading,
    error,
    refetch: fetchBrands
  };
};
