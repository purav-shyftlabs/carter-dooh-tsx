import React, { useMemo, useState, useMemo as useReactMemo, useEffect } from 'react';
import { DataTable, SearchInput, PriorityFilters, ColumnToggle } from 'shyftlabs-dsl';
import Link from 'next/link';
import styles from '../styles/playlist-listing.module.scss';
import { carterColors } from 'shyftlabs-dsl';
import { playlistRenderService, type PlaylistListItem } from '@/services/content/playlist.service';
import PlaylistCardView from './playlist-card-view.component';

type IPlaylistListingProps = {
  playlistType?: string;
  viewMode?: 'table' | 'grid';
};

const PlaylistListing: React.FC<IPlaylistListingProps> = ({ playlistType, viewMode = 'table' }) => {
  const [pageNo, setPageNo] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [apiPlaylists, setApiPlaylists] = useState<PlaylistListItem[]>([]);

  const sortBy = 'name';
  const sortDesc = false;
  const sorting = useMemo(() => [{ id: sortBy, desc: sortDesc }], [sortBy, sortDesc]);

  type Row = {
    id: string;
    name: string;
    description: string;
    status: string;
    totalItems: string;
    duration: string;
    createdAt: string;
  };

  // Load from API
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setIsLoading(true);
        const skip = (pageNo - 1) * pageSize;
        const result = await playlistRenderService.getPlaylists({ 
          status: statusFilter || 'active',
          limit: pageSize, 
          skip,
          sort: 'name ASC'
        });
        
        if (!mounted) return;
        
        const playlists = result.data || [];
        setApiPlaylists(playlists);
        setTotalCount(playlists.length); // Note: API doesn't return total count, using current page length
      } catch (e) {
        console.error('Error loading playlists:', e);
        setApiPlaylists([]);
        setTotalCount(0);
      } finally {
        setIsLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [pageNo, pageSize, statusFilter]);

  // Filter and process playlist data
  const filteredPlaylists = useReactMemo(() => {
    let filtered = apiPlaylists;

    if (playlistType === 'archived') {
      filtered = filtered.filter(playlist => playlist.status === 'archived');
    } else if (playlistType === 'all') {
      filtered = filtered.filter(playlist => playlist.status === 'active');
    }

    if (statusFilter) {
      filtered = filtered.filter(playlist => playlist.status === statusFilter);
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(playlist => 
        playlist.name.toLowerCase().includes(searchLower) ||
        playlist.description.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [apiPlaylists, playlistType, statusFilter, search]);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const rows = useReactMemo<Row[]>(() => {
    return filteredPlaylists.map((playlist: PlaylistListItem) => ({
      id: String(playlist.id),
      name: playlist.name,
      description: playlist.description,
      status: playlist.status,
      totalItems: `${playlist.total_items} items`,
      duration: formatDuration(playlist.duration_seconds),
      createdAt: formatDate(playlist.created_at),
    }));
  }, [filteredPlaylists]);

  type CellArgs = { row: { original: Row } };
  const columns: Array<{ header: string; accessorKey: keyof Row; cell?: (args: CellArgs) => React.ReactElement }> = [
    {
      header: 'Playlist Name',
      accessorKey: 'name',
      cell: ({ row }) => {
        const name: string = row?.original?.name ?? '';
        const playlistId: string = row?.original?.id ?? '';
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
            <Link href={`/playlist/${playlistId}`} style={{ textDecoration: 'none', color: carterColors['links-blue'], fontWeight: 500 }}>
              {name}
            </Link>
          </div>
        );
      },
    },
    { header: 'Description', accessorKey: 'description' },
    { 
      header: 'Status', 
      accessorKey: 'status',
      cell: ({ row }) => {
        const status = row?.original?.status ?? '';
        const isActive = status === 'active';
        const isArchived = status === 'archived';
        
        let backgroundColor, color;
        if (isActive) {
          backgroundColor = '#E8F5E8';
          color = '#2E7D32';
        } else if (isArchived) {
          backgroundColor = '#FFF3E0';
          color = '#F57C00';
        } else {
          backgroundColor = '#FFEBEE';
          color = '#C62828';
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
    { header: 'Items', accessorKey: 'totalItems' },
    { header: 'Duration', accessorKey: 'duration' },
    { header: 'Created', accessorKey: 'createdAt' },
  ];

  const visibleColumns = useReactMemo(() => {
    if (!columnVisibility || Object.keys(columnVisibility).length === 0) return columns;
    return columns.filter((c) => columnVisibility[c.accessorKey] !== false);
  }, [columns, columnVisibility]);

  type Option = { label: string; value: string };

  const statusOptions: Option[] = useMemo(
    () => [
      { label: 'All Status', value: '' },
      { label: 'Active', value: 'active' },
      { label: 'Archived', value: 'archived' },
      { label: 'Draft', value: 'draft' },
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
          placeholder="Search for Playlist"
          data-testid="playlist-search-input"
        />
        <PriorityFilters
          placeholder="Status"
          mode="single"
          initialValue={statusInitialOption as unknown as { label: string; value: string }}
          onChange={(selected: { value?: string } | null) => {
            const value = selected?.value ?? '';
            setStatusFilter(value ?? '');
            setPageNo(1);
          }}
          options={statusOptions}
          {...({ closeMenuOnSelect: false } as { closeMenuOnSelect: boolean })}
        />
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
          fallback={{ title: 'No Playlists Yet', description: 'Click "+ New Playlist" to create' }}
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
        <PlaylistCardView
          playlists={filteredPlaylists}
          loading={isLoading}
          pageNo={pageNo}
          pageSize={pageSize}
          totalCount={totalCount}
          onPaginationChange={(nextPageNo, nextPageSize) => {
            setPageNo(Number(nextPageNo));
            setPageSize(Number(nextPageSize));
          }}
        />
      )}
    </div>
  );
};

export default PlaylistListing;
