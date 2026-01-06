import React, { useState, useEffect, useMemo } from 'react';
import { DataTable, SearchInput } from 'shyftlabs-dsl';
import { screensService } from '@/services/screens/screens.service';
import type { Screen, ScreenStatus } from '@/types/screens';
import styles from '../styles/screens-listing.module.scss';
import Link from 'next/link';
import ROUTES from '@/common/routes';
import ScreensCardView from './screens-card-view.component';

type ScreensListingProps = {
  statusFilter?: ScreenStatus;
  onlineFilter?: boolean;
  brandId?: number;
  viewMode?: 'table' | 'grid';
};

const ScreensListing: React.FC<ScreensListingProps> = ({ statusFilter, onlineFilter, brandId, viewMode = 'table' }) => {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [pageNo, setPageNo] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Load screens from API
  useEffect(() => {
    let mounted = true;
    const loadScreens = async () => {
      try {
        setIsLoading(true);
        console.log('Loading screens with params:', { statusFilter, onlineFilter, brandId });
        const params: { status?: ScreenStatus | string; brandId?: number } = {};
        if (statusFilter) {
          params.status = statusFilter;
        }
        if (brandId) {
          params.brandId = brandId;
        }
        const result = await screensService.listScreens(params);
        
        console.log('Screens loaded:', result);
        
        if (!mounted) return;
        
        if (Array.isArray(result)) {
          setScreens(result);
          setTotalCount(result.length);
        } else {
          console.warn('Unexpected result format:', result);
          setScreens([]);
          setTotalCount(0);
        }
      } catch (error) {
        console.error('Error loading screens:', error);
        // Log more error details
        if (error && typeof error === 'object') {
          if ('message' in error) {
            console.error('Error message:', error.message);
          }
          if ('response' in error) {
            const axiosError = error as { response?: { status?: number; data?: unknown } };
            console.error('HTTP Status:', axiosError.response?.status);
            console.error('Response data:', axiosError.response?.data);
          }
        }
        setScreens([]);
        setTotalCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    loadScreens();
    return () => {
      mounted = false;
    };
  }, [statusFilter, brandId]);

  // Filter screens by search query and online status
  const filteredScreens = useMemo(() => {
    let filtered = screens;
    
    // Filter by online status if specified
    if (onlineFilter !== undefined) {
      filtered = filtered.filter(screen => screen.isOnline === onlineFilter);
    }
    
    // Filter by search query
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        screen =>
          screen.name.toLowerCase().includes(searchLower) ||
          (screen.deviceName && screen.deviceName.toLowerCase().includes(searchLower)) ||
          screen.macAddress.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [screens, search, onlineFilter]);

  // Format rows for DataTable
  type Row = {
    id: string;
    name: string;
    deviceName: string;
    macAddress: string;
    status: string;
    isOnline: boolean;
    lastSeenAt: string;
    createdAt: string;
  };

  const rows = useMemo<Row[]>(() => {
    return filteredScreens.map((screen: Screen) => ({
      id: String(screen.id),
      name: screen.name,
      deviceName: screen.deviceName || screen.name,
      macAddress: screen.macAddress,
      status: String(screen.status || ''),
      isOnline: screen.isOnline,
      lastSeenAt: screen.lastSeenAt || '',
      createdAt: screen.createdAt,
    }));
  }, [filteredScreens]);

  type CellArgs = { row: { original: Row } };
  const columns: Array<{ header: string; accessorKey: keyof Row; cell?: (args: CellArgs) => React.ReactElement }> = [
    {
      header: 'Screen Name',
      accessorKey: 'name',
      cell: ({ row }) => (
        <Link href={`${ROUTES.BILLBOARD.LIST}/${row.original.id}`} className={styles.link}>
          {row.original.name}
        </Link>
      ),
    },
    {
      header: 'Device Name',
      accessorKey: 'deviceName',
    },
    {
      header: 'MAC Address',
      accessorKey: 'macAddress',
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => {
        const status = String(row.original.status || '').toLowerCase();
        return (
          <span className={`${styles.status} ${styles[`status-${status}`] || ''}`}>
            {row.original.status}
          </span>
        );
      },
    },
    {
      header: 'Online',
      accessorKey: 'isOnline',
      cell: ({ row }) => (
        <span className={row.original.isOnline ? styles.online : styles.offline}>
          {row.original.isOnline ? 'Online' : 'Offline'}
        </span>
      ),
    },
    {
      header: 'Last Seen',
      accessorKey: 'lastSeenAt',
      cell: ({ row }) => {
        if (!row.original.lastSeenAt) return <span>Never</span>;
        const date = new Date(row.original.lastSeenAt);
        return <span>{date.toLocaleString()}</span>;
      },
    },
    {
      header: 'Created',
      accessorKey: 'createdAt',
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt);
        return <span>{date.toLocaleDateString()}</span>;
      },
    },
  ];

  // Paginate screens for card view
  const paginatedScreens = useMemo(() => {
    const start = (pageNo - 1) * pageSize;
    const end = start + pageSize;
    return filteredScreens.slice(start, end);
  }, [filteredScreens, pageNo, pageSize]);

  return (
    <div className={styles.container}>
      <div className={styles.searchContainer}>
        <SearchInput
          placeholder="Search screens by name, device, or MAC address..."
          initialValue={search}
          onSearch={(val: string) => {
            setSearch(val);
            setPageNo(1);
          }}
        />
      </div>
      {viewMode === 'table' ? (
        <DataTable
          data={rows}
          columns={columns}
          loading={isLoading}
          fallback={{ title: 'No Screens Found', description: 'No screens match your search criteria' }}
          pagination={{
            pageNo,
            pageSize,
            totalCount: filteredScreens.length,
          }}
          onPaginationChange={(nextPageNo: number, nextPageSize: number) => {
            setPageNo(Number(nextPageNo));
            setPageSize(Number(nextPageSize));
          }}
        />
      ) : (
        <ScreensCardView
          screens={paginatedScreens}
          loading={isLoading}
          pageNo={pageNo}
          pageSize={pageSize}
          totalCount={filteredScreens.length}
          onPaginationChange={(nextPageNo: number, nextPageSize: number) => {
            setPageNo(Number(nextPageNo));
            setPageSize(Number(nextPageSize));
          }}
        />
      )}
    </div>
  );
};

export default ScreensListing;

