import api from '../api/api-client';

export type BrandItem = {
  id: string | number;
  name: string;
  label?: string;
};

export type BrandsListResponse = {
  success?: boolean;
  message?: string;
  data?: {
    items: BrandItem[];
    totalCount?: number;
    pagination?: unknown;
  } | BrandItem[];
};

export type BrandsListParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export type CreateBrandPayload = {
  name: string;
  type: string;
  assetUrl?: string;
  publisherSharePerc: number;
  metadata: {
    category: string;
  };
  allowAllProducts: boolean;
  parentCompanyId?: number;
  customId?: string;
};

export type CreateBrandResponse = {
  success?: boolean;
  message?: string;
  data?: {
    id: string | number;
    name: string;
    type: string;
    assetUrl?: string;
    publisherSharePerc: number;
    metadata: {
      category: string;
    };
    allowAllProducts: boolean;
    parentCompanyId?: number;
    customId?: string;
  };
};

export type BrandDetailsDTO = {
  id: string | number;
  name: string;
  type: string;
  assetUrl?: string;
  publisherSharePerc: number;
  metadata: {
    category: string;
  };
  allowAllProducts: boolean;
  parentCompanyId?: number;
  customId?: string;
};

export type UpdateBrandPayload = {
  name?: string;
  type?: string;
  assetUrl?: string;
  publisherSharePerc?: number;
  metadata?: {
    category: string;
  };
  allowAllProducts?: boolean;
  parentCompanyId?: number;
  customId?: string;
};

class BrandsService {
  async getBrands(params: BrandsListParams = {}): Promise<{ items: BrandItem[]; totalCount?: number }> {
    const { page = 1, limit = 20, search } = params;
    const queryParams: Record<string, string | number> = { page, limit };
    
    if (search && search.trim() !== '') {
      queryParams.search = search.trim();
    }
    
    const response = await api.get('/brands', { params: queryParams });
    const raw = response.data as BrandsListResponse;
    const data = (raw?.data ?? raw) as unknown;
    
    if (Array.isArray(data)) {
      return { items: data as BrandItem[], totalCount: data.length };
    }
    
    const items = (data as { items?: BrandItem[]; totalCount?: number })?.items ?? [];
    const totalCount = (data as { totalCount?: number })?.totalCount;
    
    return { 
      items: Array.isArray(items) ? items : [], 
      totalCount 
    };
  }

  async createBrand(payload: CreateBrandPayload): Promise<CreateBrandResponse> {
    const response = await api.post('/brands', payload);
    return response.data as CreateBrandResponse;
  }

  async getBrandById(id: string | number): Promise<BrandDetailsDTO> {
    const response = await api.get(`/brands/${id}`);
    return (response.data?.data ?? response.data) as BrandDetailsDTO;
  }

  async updateBrand(id: string | number, payload: UpdateBrandPayload): Promise<BrandDetailsDTO> {
    const response = await api.patch(`/brands/${id}`, payload);
    return (response.data?.data ?? response.data) as BrandDetailsDTO;
  }
}

export default BrandsService;


