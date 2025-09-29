import api from '../api/api-client';
import { Brand } from '@/types/folder';

class BrandsService {
  private baseUrl = '/brands';

  // Get all brands
  async getBrands(params?: { page?: number; limit?: number; search?: string }): Promise<Brand[] | { items: Brand[]; totalCount: number }> {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);
      
      const url = queryParams.toString() ? `${this.baseUrl}?${queryParams.toString()}` : this.baseUrl;
      const response = await api.get(url);
      console.log('Brands API response:', response.data); // Debug log
      
      // If parameters were provided, expect paginated response
      if (params) {
        // Handle paginated response structure
        if (response.data && response.data.data && response.data.data.items && Array.isArray(response.data.data.items)) {
          return {
            items: response.data.data.items,
            totalCount: response.data.data.totalCount || response.data.data.items.length
          };
        } else if (response.data && response.data.items && Array.isArray(response.data.items)) {
          return {
            items: response.data.items,
            totalCount: response.data.totalCount || response.data.items.length
          };
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          return {
            items: response.data.data,
            totalCount: response.data.totalCount || response.data.data.length
          };
        } else {
          console.warn('Unexpected paginated brands API response structure:', response.data);
          return { items: [], totalCount: 0 };
        }
      }
      
      // Handle non-paginated response (for useBrands hook)
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && response.data.data && response.data.data.items && Array.isArray(response.data.data.items)) {
        // Handle nested structure: response.data.data.items
        return response.data.data.items;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      } else if (response.data && response.data.items && Array.isArray(response.data.items)) {
        // Handle paginated response structure even without params
        return response.data.items;
      } else if (response.data && typeof response.data === 'object') {
        // If response.data is an object but not an array, log it for debugging
        console.warn('Brands API returned object instead of array:', response.data);
        // Try to extract brands from common object structures
        if (response.data.brands && Array.isArray(response.data.brands)) {
          return response.data.brands;
        }
        if (response.data.results && Array.isArray(response.data.results)) {
          return response.data.results;
        }
      }
      
      console.warn('Unexpected brands API response structure:', response.data);
      return [];
    } catch (error) {
      console.error('Error fetching brands:', error);
      // Return empty array/object instead of throwing to prevent component crashes
      return params ? { items: [], totalCount: 0 } : [];
    }
  }

  // Get brand by ID
  async getBrandById(id: number): Promise<Brand> {
    try {
      const response = await api.get(`${this.baseUrl}/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching brand:', error);
      throw error;
    }
  }
}

export const brandsService = new BrandsService();
export default BrandsService;