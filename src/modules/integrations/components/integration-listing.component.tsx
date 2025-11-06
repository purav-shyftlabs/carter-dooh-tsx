import React, { useState, useEffect, useMemo } from 'react';
import { DataTable, SearchInput } from 'shyftlabs-dsl';
import { useRouter } from 'next/router';
import styles from '../styles/integrations.module.scss';
import { integrationsService } from '@/services/integrations/integrations.service';
import { Integration, IntegrationStatus } from '@/types/integrations';
import { Button } from 'shyftlabs-dsl';
import { Settings, Trash2, RefreshCw, Power } from 'lucide-react';

const IntegrationListing: React.FC = () => {
  const router = useRouter();
  const [pageNo, setPageNo] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);

  useEffect(() => {
    let mounted = true;
    const loadIntegrations = async () => {
      try {
        setIsLoading(true);
        const response = await integrationsService.getIntegrations({
          status: statusFilter || undefined,
          page: pageNo,
          limit: pageSize,
        });
        if (!mounted) return;
        setIntegrations(response.data.items);
        setTotalCount(response.data.pagination.total);
      } catch (error) {
        console.error('Error loading integrations:', error);
        setIntegrations([]);
        setTotalCount(0);
      } finally {
        setIsLoading(false);
      }
    };
    loadIntegrations();
    return () => {
      mounted = false;
    };
  }, [pageNo, pageSize, statusFilter]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to disconnect this integration?')) return;
    try {
      await integrationsService.deleteIntegration(id);
      setIntegrations(integrations.filter((int) => int.id !== id));
    } catch (error) {
      console.error('Error deleting integration:', error);
      alert('Failed to delete integration');
    }
  };

  const handleToggleEnabled = async (integration: Integration) => {
    try {
      await integrationsService.updateIntegration(integration.id, {
        enabled: !integration.enabled,
      });
      setIntegrations(
        integrations.map((int) => (int.id === integration.id ? { ...int, enabled: !int.enabled } : int)),
      );
    } catch (error) {
      console.error('Error toggling integration:', error);
      alert('Failed to update integration');
    }
  };

  const handleSync = async (id: number) => {
    try {
      await integrationsService.triggerSync(id);
      // Refresh the list
      const response = await integrationsService.getIntegrations({
        page: pageNo,
        limit: pageSize,
      });
      setIntegrations(response.data.items);
    } catch (error) {
      console.error('Error syncing integration:', error);
      alert('Failed to sync integration');
    }
  };

  const getStatusBadgeClass = (status: IntegrationStatus) => {
    switch (status) {
      case 'connected':
        return styles.statusConnected;
      case 'error':
        return styles.statusError;
      case 'disconnected':
        return styles.statusDisconnected;
      case 'pending':
        return styles.statusPending;
      default:
        return '';
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: 'app',
        header: 'App',
        cell: ({ row }: { row: { original: Integration } }) => (
          <div className={styles.appCell}>
            {row.original.app?.logo_url ? (
              <img src={row.original.app.logo_url} alt={row.original.app.name} className={styles.appLogo} />
            ) : (
              <div className={styles.appLogoPlaceholder}>{row.original.app?.name?.charAt(0) || '?'}</div>
            )}
            <div>
              <div className={styles.appName}>{row.original.app?.name || 'Unknown App'}</div>
              <div className={styles.appCategory}>{row.original.app?.category}</div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }: { row: { original: Integration } }) => (
          <div className={styles.statusCell}>
            <span className={`${styles.statusBadge} ${getStatusBadgeClass(row.original.status)}`}>
              {row.original.status}
            </span>
            {row.original.enabled && (
              <span className={styles.enabledBadge}>Enabled</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'sync_frequency',
        header: 'Sync Frequency',
        cell: ({ row }: { row: { original: Integration } }) => (
          <span className={styles.syncFrequency}>{row.original.sync_frequency}</span>
        ),
      },
      {
        accessorKey: 'last_synced_at',
        header: 'Last Synced',
        cell: ({ row }: { row: { original: Integration } }) => (
          <div className={styles.lastSynced}>
            {row.original.last_synced_at
              ? new Date(row.original.last_synced_at).toLocaleString()
              : 'Never'}
          </div>
        ),
      },
      {
        accessorKey: 'actions',
        header: 'Actions',
        cell: ({ row }: { row: { original: Integration } }) => (
          <div className={styles.actions}>
            <Button
              label=""
              size="small"
              variant="tertiary"
              icon={<RefreshCw size={16} />}
              onClick={() => handleSync(row.original.id)}
              title="Sync Now"
            />
            <Button
              label=""
              size="small"
              variant="tertiary"
              icon={<Power size={16} />}
              onClick={() => handleToggleEnabled(row.original)}
              title={row.original.enabled ? 'Disable' : 'Enable'}
            />
            <Button
              label=""
              size="small"
              variant="tertiary"
              icon={<Settings size={16} />}
              onClick={() => router.push(`/integrations/${row.original.id}`)}
              title="Configure"
            />
            <Button
              label=""
              size="small"
              variant="danger"
              icon={<Trash2 size={16} />}
              onClick={() => handleDelete(row.original.id)}
              title="Delete"
            />
          </div>
        ),
      },
    ],
    [router, integrations],
  );

  return (
    <div className={styles.integrationListingContainer}>
      <div className={styles.filters}>
        <div className={styles.searchContainer}>
          <SearchInput
            placeholder="Search integrations..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setSearch(e.target.value);
              setPageNo(1);
            }}
          />
        </div>
        <div className={styles.statusFilter}>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPageNo(1);
            }}
            className={styles.statusSelect}
          >
            <option value="">All Statuses</option>
            <option value="connected">Connected</option>
            <option value="error">Error</option>
            <option value="disconnected">Disconnected</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      <DataTable
        data={integrations}
        columns={columns}
        loading={isLoading}
        fallback={{ title: 'No Integrations Found', description: 'Connect an app to get started' }}
        pagination={{
          pageNo,
          pageSize,
          totalCount: totalCount,
        }}
        onPaginationChange={(nextPageNo, nextPageSize) => {
          setPageNo(Number(nextPageNo));
          setPageSize(Number(nextPageSize));
        }}
      />
    </div>
  );
};

export default IntegrationListing;

