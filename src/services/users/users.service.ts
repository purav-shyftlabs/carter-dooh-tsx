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
  currentAccountId: number;
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
  data?: any;
  timestamp: string;
};

class UsersService {
  async getUsers(params: UsersListParams): Promise<UsersListResponse> {
    const query = {
      accountId: String(params.accountId ?? ''),
      search: String(params.search ?? ''),
      userRole: String(params.userRole ?? ''),
      userType: String(params.userType ?? ''),
      status: String(params.status ?? ''),
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 10),
      sortBy: String(params.sortBy ?? 'name'),
      sortType: String(params.sortType ?? 0),
    } as const;

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
}

export default UsersService;


