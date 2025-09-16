import api from '../api/api-client';

export type UsersListParams = {
  accountId: number | string;
  search?: string;
  userRole?: string;
  userType?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortType?: number; // 0: asc, 1: desc
};

export type UserListItem = {
  id: string | number;
  name: string;
  email: string;
  role?: string;
  active?: boolean;
  isFirstTimeLogin?: boolean;
};

export type UsersListResponse = {
  success: boolean;
  message: string;
  data: {
    items: UserListItem[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
  timestamp: string;
};

export type CreateUserPayload = {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  timezoneName: string;
  userType: string;
  roleType: string;
  allowAllBrands: boolean;
  allowAllBrandsList: string[];
  permissions: Array<{
    permissionType: string;
    accessLevel: string;
  }>;
};

export type CreateUserResponse = {
  success: boolean;
  message: string;
  data?: unknown;
  timestamp: string;
};

export type UpdateUserPayload = {
  name?: string;
  roleType?: string;
  permissions?: Array<{
    permissionType: string;
    accessLevel: string;
  }>;
};

export type UserPermissionDTO = {
  permissionType: string;
  accessLevel: string;
};

export type UserDetailsDTO = {
  id: string | number;
  name?: string;
  email?: string;
  timezoneName?: string;
  timeZoneName?: string;
  userType?: string;
  roleType?: string;
  allowAllAdvertisers?: boolean;
  allowAllBrands?: boolean;
  allowAllBrandsList?: string[];
  permissions?: UserPermissionDTO[];
};

class UsersService {
  async getUsers(params: UsersListParams): Promise<UsersListResponse> {
    const query: Record<string, string | number> = {
      accountId: String(params.accountId ?? ''),
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 10),
      sortBy: String(params.sortBy ?? 'name'),
      sortType: String(params.sortType ?? 0),
    };

    if (params.search && String(params.search).trim() !== '') {
      query.search = String(params.search).trim();
    }
    if (params.userRole && String(params.userRole).trim() !== '') {
      query.userRole = String(params.userRole).trim();
    }
    if (params.userType && String(params.userType).trim() !== '') {
      query.userType = String(params.userType).trim();
    }
    if (params.status && String(params.status).trim() !== '') {
      query.status = String(params.status).trim();
    }

    const response = await api.get('/user', { params: query });
    return response.data as UsersListResponse;
  }

  async toggleUserActiveById({ id, activate }: { id: string | number; activate: boolean }): Promise<void> {
    await api.patch(`/user/${id}/status`, { active: activate });
  }

  async toggleMultipleUserActiveById(updates: { id: string | number; activate: boolean }[]): Promise<void> {
    await api.patch(`/user/status/bulk`, { updates });
  }

  async resendInvitation(id: string | number): Promise<void> {
    await api.post(`/user/${id}/resend-invite`);
  }

  async createUser(payload: CreateUserPayload): Promise<CreateUserResponse> {
    const response = await api.post('/user', payload);
    return response.data as CreateUserResponse;
  }

  async getUserById(id: string | number): Promise<UserDetailsDTO> {
    const response = await api.get(`/user/${id}`);
    return (response.data?.data ?? response.data) as UserDetailsDTO;
  }

  async updateUser(id: string | number, payload: UpdateUserPayload): Promise<UserDetailsDTO> {
    const response = await api.patch(`/user/${id}`, payload);
    // API returns the updated user back
    return (response.data?.data ?? response.data) as UserDetailsDTO;
  }

  async getAccountsByUser(): Promise<Array<Record<string, unknown>>> {
    const response = await api.get(`/users/by-user`);
    const data = response.data?.data ?? response.data;
    return (Array.isArray(data) ? data : []) as Array<Record<string, unknown>>;
  }
}

export default UsersService;


