import React, { useMemo, useState, useMemo as useReactMemo, useEffect } from 'react';
import useSWR from 'swr';
import { DataTable, SearchInput, PriorityFilters, ColumnToggle } from 'shyftlabs-dsl';
import UsersService, { UsersListParams, UsersListResponse, UserListItem } from '@/services/users/users.service';
import Avatar from 'react-avatar';
import Link from 'next/link';
import useUser from '@/contexts/user-data/user-data.hook';
import styles from '../styles/user-listing.module.scss';
import { statusFiler } from '../helper/users.common';
import { useQueryHelper } from '@/common/query-helper.hook';
import { RoleType } from '@/types';
import { carterColors } from 'shyftlabs-dsl';

type IUserListingProps = {
  userType?: string;
};

const UserListing: React.FC<IUserListingProps> = ({ userType }) => {
  const usersService = useMemo(() => new UsersService(), []);
  const { user } = useUser();

  const accountId = (user?.accountId as unknown as number) || 1;
  const { getQueriesForAPI, updateRegularQuery, updateFilterQuery } = useQueryHelper();
  const q = getQueriesForAPI([
    { key: 'page', defaultValue: '1' },
    { key: 'limit', defaultValue: '10' },
    { key: 'search', defaultValue: '' },
    { key: 'userRole', defaultValue: '' },
    { key: 'status', defaultValue: '' },
    { key: 'sortBy', defaultValue: 'name' },
    { key: 'sortType', defaultValue: '+' }, // '+' asc, '-' desc
  ] as const);

  // Local state mirrors URL but drives data fetching so only table updates
  const [pageNo, setPageNo] = useState<number>(Number(q.page ?? '1'));
  const [pageSize, setPageSize] = useState<number>(Number(q.limit ?? '10'));
  const [search, setSearch] = useState<string>(q.search ?? '');
  const [roleFilter, setRoleFilter] = useState<string>(q.userRole ?? '');
  const [statusFilter, setStatusFilter] = useState<string>(q.status ?? '');
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});

  const sortBy = q.sortBy ?? 'name';
  const sortTypeSign = q.sortType === '-' ? '-' : '+';
  const sortDesc = sortTypeSign === '-';
  const sorting = useMemo(() => [{ id: sortBy, desc: sortDesc }], [sortBy, sortDesc]);
  const apiSortType = sortDesc ? 1 : 0;

  // Keep local state in sync if URL changes externally (e.g., back/forward nav)
  useEffect(() => {
    setPageNo(Number(q.page ?? '1'));
    setPageSize(Number(q.limit ?? '10'));
    setSearch(q.search ?? '');
    setRoleFilter(q.userRole ?? '');
    setStatusFilter(q.status ?? '');
  }, [q.page, q.limit, q.search, q.userRole, q.status]);

  const { data, isLoading, isValidating, error } = useSWR<UsersListResponse>(
    { key: 'users-list', accountId, userType, pageNo, pageSize, search, roleFilter, statusFilter, sortBy, sortDesc },
    async ({ accountId: acc, pageNo: p, pageSize: ps, userType: ut }) => {
      const req: UsersListParams = {
        accountId: String(acc),
        page: Number(p),
        limit: Number(ps),
        sortBy: String(sortBy),
        sortType: Number(apiSortType),
      };

      if (ut && String(ut).trim() !== '') {
        req.userType = String(ut).trim();
      }
      if (search && String(search).trim() !== '') {
        req.search = String(search).trim();
      }
      if (roleFilter && String(roleFilter).trim() !== '') {
        req.userRole = String(roleFilter).trim();
      }
      if (statusFilter && String(statusFilter).trim() !== '') {
        req.status = String(statusFilter).trim();
      }

      return usersService.getUsers(req);
    },
    { revalidateOnMount: true, revalidateOnFocus: false }
  );

  type Row = {
    id: string;
    name: string;
    email: string;
    advertisers: string;
    role: string;
    lastActive: string;
  };

  const rows = useReactMemo<Row[]>(() => {
    const items: UserListItem[] = data?.data?.items ?? [];
    return items.map((u: UserListItem & { allowAllAdvertisers?: boolean; allowedBrands?: string[]; roleType?: string }) => ({
      id: String(u.id),
      name: u.name,
      email: u.email,
      advertisers: u.allowAllAdvertisers ? 'All Advertisers' : (u.allowedBrands || []).join(', '),
      role: (u.roleType || '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c: string) => c.toUpperCase()),
      lastActive: '—',
    }));
  }, [data]);

  type CellArgs = { row: { original: Row } };
  const columns: Array<{ header: string; accessorKey: keyof Row; cell?: (args: CellArgs) => React.ReactElement }> = [
    {
      header: 'Name',
      accessorKey: 'name',
      cell: ({ row }) => {
        const name: string = row?.original?.name ?? '';
        const email: string = row?.original?.email ?? '';
        const displayName = (name && name.trim().length > 0) ? name : (email || '').split('@')[0];
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar name={displayName} size={"26"} round={true} textSizeRatio={2.4} />
            <Link href={`/users/user/${row?.original?.id ?? ''}`} style={{ textDecoration: 'none', color: carterColors['links-blue'], fontWeight: 500 }}>
              {displayName}
            </Link>
          </div>
        );
      },
    },
    { header: 'Email', accessorKey: 'email' },
    { header: 'Advertisers', accessorKey: 'advertisers' },
    { header: 'Role', accessorKey: 'role' },
    { header: 'Last Active', accessorKey: 'lastActive' },
  ];

  const visibleColumns = useReactMemo(() => {
    if (!columnVisibility || Object.keys(columnVisibility).length === 0) return columns;
    return columns.filter((c) => columnVisibility[c.accessorKey] !== false);
  }, [columns, columnVisibility]);

  type Option = { label: string; value: string };
  const roleOptions: Option[] = useMemo(
    () => [
      { label: 'All Roles', value: '' },
      { label: 'Admin', value: RoleType.Admin },
      { label: 'Operator User', value: RoleType.OperatorUser },
      { label: 'Custom User', value: RoleType.CustomUser },
    ],
    []
  );

  const roleInitialOption = useMemo(() => roleOptions.find(o => o.value === roleFilter) ?? roleOptions[0], [roleOptions, roleFilter]);
  const statusInitialOption = useMemo(() => (statusFiler as Array<{ label: string; value: string }>).find((o) => o.value === statusFilter) ?? (statusFiler as Array<{ label: string; value: string }>)[0], [statusFilter]);

  const handleColumnVisibilityChange = (
    updaterOrValue: ((prev: Record<string, boolean>) => Record<string, boolean>) | Record<string, boolean>
  ) => {
    if (typeof updaterOrValue === 'function') {
      const fn = updaterOrValue as (prev: Record<string, boolean>) => Record<string, boolean>;
      setColumnVisibility((prev: Record<string, boolean>) => fn(prev));
    } else {
      setColumnVisibility(updaterOrValue as Record<string, boolean>);
    }
  };

  return (
    <div className={styles.container}>
      {error && (
        <div style={{ padding: '16px', backgroundColor: '#ffebee', color: '#c62828', marginBottom: '16px' }}>
          Error loading users
        </div>
      )}
      {userType && (
        <div className={styles.section_head}>
          <SearchInput
            initialValue={search}
            onSearch={(val) => {
              setSearch(val);
              updateRegularQuery({ search: val, page: '1' });
              setPageNo(1);
            }}
            placeholder="Search for User"
            data-testid="user-search-input"
          />
          <PriorityFilters
            placeholder="Roles"
            initialValue={roleInitialOption as unknown as Option}
            onChange={(selected: { value?: string } | null) => {
              const value = selected?.value ?? '';
              setRoleFilter(value ?? '');
              updateFilterQuery('userRole', value);
              setPageNo(1);
            }}
            mode="single"
            options={roleOptions}
            {...({ closeMenuOnSelect: false } as { closeMenuOnSelect: boolean })}
          />
          <PriorityFilters
            placeholder="Status"
            mode="single"
            initialValue={statusInitialOption as unknown as { label: string; value: string }}
            onChange={(selected: { value?: string } | null) => {
              const value = selected?.value ?? '';
              setStatusFilter(value ?? '');
              updateFilterQuery('status', value);
              setPageNo(1);
            }}
            options={statusFiler}
            {...({ closeMenuOnSelect: false } as { closeMenuOnSelect: boolean })}
          />
          <div className={styles.end_controls}>
            <ColumnToggle
              columns={columns}
              enableColumnHiding
              columnVisibility={columnVisibility}
              onColumnVisibilityChange={handleColumnVisibilityChange}
            />
          </div>
        </div>
      )}
      <DataTable
        loading={isLoading || isValidating}
        columns={visibleColumns}
        data={rows}
        fallback={{ title: 'No User Yet', description: 'Click “+ New User” to create' }}
        pagination={{
          pageNo: Number(data?.data?.pagination?.currentPage ?? pageNo),
          pageSize: Number(data?.data?.pagination?.itemsPerPage ?? pageSize),
          totalCount: Number(data?.data?.pagination?.totalItems ?? 0),
          sort: sorting,
        }}
        onPaginationChange={(nextPageNo, nextPageSize, nextSort) => {
          const nextId = nextSort?.[0]?.id ?? sortBy;
          const nextDesc = !!nextSort?.[0]?.desc;
          setPageNo(Number(nextPageNo));
          setPageSize(Number(nextPageSize));
          updateRegularQuery(
            {
              page: String(nextPageNo),
              limit: String(nextPageSize),
              sortBy: String(nextId),
              sortType: nextDesc ? '-' : '+',
            },
            { resetPage: false }
          );
        }}
      />
    </div>
  );
};

export default UserListing;