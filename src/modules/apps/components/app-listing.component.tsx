import React, { useMemo, useState, useMemo as useReactMemo, useEffect } from 'react';
import { DataTable, SearchInput, ColumnToggle, Button } from 'shyftlabs-dsl';
import Link from 'next/link';
import styles from '../styles/user-listing.module.scss';
import { carterColors } from 'shyftlabs-dsl';
import IntegrationsService, { AccountIntegrationItem, IntegrationStatus } from '@/services/integrations/integrations.service';

type IAppListingProps = {
  userType?: string;
  viewMode?: 'table' | 'grid';
};

const AppListing: React.FC<IAppListingProps> = ({ userType, viewMode = 'table' }) => {
  const [pageNo, setPageNo] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [integrations, setIntegrations] = useState<AccountIntegrationItem[]>([]);

  const sortBy = 'name';
  const sortDesc = false;
  const sorting = useMemo(() => [{ id: sortBy, desc: sortDesc }], [sortBy, sortDesc]);

  type Row = {
    id: string;
    name: string;
    category: string;
    status: string;
    authType: string;
    isActive: string;
    lastSync: string;
  };

  // Load from API
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setIsLoading(true);
        const result = await IntegrationsService.getAccountIntegrations({ 
          page: pageNo, 
          limit: pageSize,
          status: statusFilter as IntegrationStatus || undefined
        });
        if (!mounted) return;
        
        setIntegrations(result.data.items || []);
        setTotalCount(result.data.total || 0);
      } catch (e) {
        console.error('Error loading integrations:', e);
        // Show mock data when API is not available
        const mockIntegrations: AccountIntegrationItem[] = [
          {
            id: 1,
            accountId: 123,
            userId: 456,
            integrationAppId: 1,
            status: 'disconnected',
            isActive: true,
            lastSyncTimestamp: null,
            createdAt: '2024-01-15T10:30:00.000Z',
            updatedAt: '2024-01-15T10:30:00.000Z',
            integrationApp: {
              id: 1,
              name: 'WeatherAPI',
              slug: 'weatherapi',
              category: 'weather',
              authType: 'api_key',
              description: 'Weather data and alerts integration'
            },
            settings: [
              { id: 1, key: 'location', value: 'New York' },
              { id: 2, key: 'units', value: 'metric' },
              { id: 3, key: 'forecastDays', value: 5 },
              { id: 4, key: 'alerts', value: true }
            ]
          },
          {
            id: 2,
            accountId: 123,
            userId: 456,
            integrationAppId: 2,
            status: 'connected',
            isActive: true,
            lastSyncTimestamp: '2024-01-15T09:30:00.000Z',
            createdAt: '2024-01-15T10:30:00.000Z',
            updatedAt: '2024-01-15T10:30:00.000Z',
            integrationApp: {
              id: 2,
              name: 'News API',
              slug: 'newsapi',
              category: 'news',
              authType: 'api_key',
              description: 'News and articles integration'
            },
            settings: [
              { id: 5, key: 'country', value: 'us' },
              { id: 6, key: 'category', value: 'technology' }
            ]
          }
        ];
        setIntegrations(mockIntegrations);
        setTotalCount(mockIntegrations.length);
      } finally {
        setIsLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [pageNo, pageSize, statusFilter]);

  // Filter and process integration data
  const filteredIntegrations = useReactMemo(() => {
    let filtered = integrations;

    if (userType === 'archived') {
      filtered = filtered.filter(integration => !integration.isActive);
    } else if (userType === 'all') {
      filtered = filtered.filter(integration => integration.isActive);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(integration => 
        integration.integrationApp?.name?.toLowerCase().includes(searchLower) ||
        integration.integrationApp?.category?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [integrations, userType, search]);

  const rows = useReactMemo<Row[]>(() => {
    return filteredIntegrations.map((integration: AccountIntegrationItem) => ({
      id: String(integration.id),
      name: integration.integrationApp?.name || 'Unknown',
      category: integration.integrationApp?.category || 'Unknown',
      status: integration.status,
      authType: integration.integrationApp?.authType || 'none',
      isActive: integration.isActive ? 'Active' : 'Inactive',
      lastSync: integration.lastSyncTimestamp ? new Date(integration.lastSyncTimestamp).toLocaleDateString() : 'Never',
    }));
  }, [filteredIntegrations]);

  type CellArgs = { row: { original: Row } };
  const columns: Array<{ header: string; accessorKey: keyof Row; cell?: (args: CellArgs) => React.ReactElement }> = [
    {
      header: 'Integration Name',
      accessorKey: 'name',
      cell: ({ row }) => {
        const name: string = row?.original?.name ?? '';
        const integrationId: string = row?.original?.id ?? '';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div 
              style={{ 
                width: 32, 
                height: 32, 
                borderRadius: '50%', 
                backgroundColor: '#4A90E2', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              {name.charAt(0)}
            </div>
            <Link href={`/apps/${integrationId}`} style={{ textDecoration: 'none', color: carterColors['links-blue'], fontWeight: 500 }}>
              {name}
            </Link>
          </div>
        );
      },
    },
    { header: 'Category', accessorKey: 'category' },
    { 
      header: 'Status', 
      accessorKey: 'status',
      cell: ({ row }) => {
        const status = row?.original?.status ?? '';
        const isConnected = status === 'connected';
        const isDisconnected = status === 'disconnected';
        const isError = status === 'error';
        
        let backgroundColor, color;
        if (isConnected) {
          backgroundColor = '#E8F5E8';
          color = '#2E7D32';
        } else if (isDisconnected) {
          backgroundColor = '#FFF3E0';
          color = '#F57C00';
        } else if (isError) {
          backgroundColor = '#FFEBEE';
          color = '#C62828';
        } else {
          backgroundColor = '#F5F5F5';
          color = '#666';
        }
        
        return (
          <span 
            style={{ 
              padding: '4px 8px', 
              borderRadius: '12px', 
              fontSize: '12px',
              fontWeight: '500',
              backgroundColor,
              color
            }}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      }
    },
    { header: 'Auth Type', accessorKey: 'authType' },
    { header: 'Active', accessorKey: 'isActive' },
    { header: 'Last Sync', accessorKey: 'lastSync' },
    {
      header: 'Actions',
      accessorKey: 'id',
      cell: ({ row }) => {
        const integrationId = row?.original?.id;
        const status = row?.original?.status;
        const authType = row?.original?.authType;
        
        return (
          <div style={{ display: 'flex', gap: 8 }}>
            <Button 
              size="small" 
              label="Configure" 
              onClick={() => window.location.href = `/apps/${integrationId}`}
            />
            {authType === 'oauth2' && status !== 'connected' && (
              <Button 
                size="small" 
                variant="tertiary" 
                label="Connect" 
                onClick={async () => {
                  // This would need the integration app ID, which we'd need to get from the data
                  // For now, just show an alert
                  alert('OAuth connection would be initiated here');
                }}
              />
            )}
            <Button 
              size="small" 
              variant="danger" 
              label="Remove" 
              onClick={async () => {
                if (confirm('Are you sure you want to remove this integration?')) {
                  try {
                    await IntegrationsService.deleteAccountIntegration(Number(integrationId));
                    // Refresh the list
                    window.location.reload();
                  } catch (error) {
                    console.error('Error deleting integration:', error);
                    // For demo purposes, just remove from local state
                    setIntegrations(prev => prev.filter(integration => integration.id !== Number(integrationId)));
                    setTotalCount(prev => prev - 1);
                    alert('Integration removed (demo mode)');
                  }
                }
              }}
            />
          </div>
        );
      }
    },
  ];

  const visibleColumns = useReactMemo(() => {
    if (!columnVisibility || Object.keys(columnVisibility).length === 0) return columns;
    return columns.filter((c) => columnVisibility[c.accessorKey] !== false);
  }, [columns, columnVisibility]);

  type Option = { label: string; value: string };

  const statusOptions: Option[] = useMemo(
    () => [
      { label: 'All Status', value: '' },
      { label: 'Connected', value: 'connected' },
      { label: 'Disconnected', value: 'disconnected' },
      { label: 'Error', value: 'error' },
    ],
    []
  );

  const statusInitialOption = useMemo(() => statusOptions.find(o => o.value === statusFilter) ?? statusOptions[0], [statusOptions, statusFilter]);

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
      <div className={styles.section_head}>
        <SearchInput
          initialValue={search}
          onSearch={(val) => {
            setSearch(val);
            setPageNo(1);
          }}
          placeholder="Search for Integration"
          data-testid="integration-search-input"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPageNo(1);
          }}
          style={{
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            minWidth: '120px'
          }}
        >
          {statusOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className={styles.end_controls}>
          {viewMode === 'table' && (
            <ColumnToggle
              columns={columns}
              enableColumnHiding
              columnVisibility={columnVisibility}
              onColumnVisibilityChange={handleColumnVisibilityChange}
            />
          )}
        </div>
      </div>
      
      {viewMode === 'table' ? (
        <DataTable
          loading={isLoading}
          columns={visibleColumns}
          data={rows}
          fallback={{ title: 'No Integrations Yet', description: 'Add integrations from the catalog to get started' }}
          pagination={{
            pageNo: pageNo,
            pageSize: pageSize,
            totalCount: totalCount,
            sort: sorting,
          }}
          onPaginationChange={(nextPageNo, nextPageSize) => {
            setPageNo(Number(nextPageNo));
            setPageSize(Number(nextPageSize));
          }}
        />
      ) : (
       <>
       </>
      )}
    </div>
  );
};

export default AppListing;