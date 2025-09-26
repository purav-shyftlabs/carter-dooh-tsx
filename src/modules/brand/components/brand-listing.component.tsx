import React, { useMemo, useState, useMemo as useReactMemo, useEffect } from 'react';
import { DataTable, SearchInput, PriorityFilters, ColumnToggle } from 'shyftlabs-dsl';
import Link from 'next/link';
import styles from '../styles/user-listing.module.scss';
import { carterColors } from 'shyftlabs-dsl';
import BrandsService from '@/services/brands/brands.service';
import BrandCardView from './brand-card-view.component';

// Brand data type based on your table schema
type Brand = {
  id: number;
  account_id: number;
  brand_logo_url: string;
  name: string;
  status: string;
  publisher_share_perc: number;
  metadata: Record<string, unknown>;
  allow_all_products: boolean;
  parent_company_id: number;
  custom_id: string;
};

type IBrandListingProps = {
  userType?: string;
  viewMode?: 'table' | 'grid';
};

// API-backed listing

const BrandListing: React.FC<IBrandListingProps> = ({ userType, viewMode = 'table' }) => {
  const [pageNo, setPageNo] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [apiBrands, setApiBrands] = useState<Brand[]>([]);
  const brandsService = useMemo(() => new BrandsService(), []);

  const sortBy = 'name';
  const sortDesc = false;
  const sorting = useMemo(() => [{ id: sortBy, desc: sortDesc }], [sortBy, sortDesc]);

  type Row = {
    id: string;
    name: string;
    status: string;
    publisherShare: string;
    allowAllProducts: string;
    customId: string;
  };

  // Load from API
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setIsLoading(true);
        const { items, totalCount: tc } = await brandsService.getBrands({ page: pageNo, limit: pageSize, search });
        if (!mounted) return;
        const mapped: Brand[] = (items || []).map((b: any) => ({
          id: Number(b?.id ?? 0),
          account_id: Number(b?.account_id ?? 0),
          brand_logo_url: String(b?.asset_url ?? ''),
          name: String(b?.name ?? ''),
          status: String(b?.status ?? ''),
          publisher_share_perc: Number(b?.publisher_share_perc ?? 0),
          metadata: (b?.metadata ?? {}) as Record<string, unknown>,
          allow_all_products: Boolean(b?.allow_all_products ?? false),
          parent_company_id: Number(b?.parent_company_id ?? 0),
          custom_id: String(b?.custom_id ?? ''),
        }));
        setApiBrands(mapped);
        setTotalCount(Number(tc ?? mapped.length));
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to load brands', e);
        setApiBrands([]);
        setTotalCount(0);
      } finally {
        setIsLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [brandsService, pageNo, pageSize, search]);

  // Filter and process brand data
  const filteredBrands = useReactMemo(() => {
    let filtered = apiBrands;

    if (userType === 'archived') {
      filtered = filtered.filter(brand => brand.status === 'archived');
    } else if (userType === 'all') {
      filtered = filtered.filter(brand => brand.status === 'active');
    }

    if (statusFilter) {
      filtered = filtered.filter(brand => brand.status === statusFilter);
    }

    return filtered;
  }, [apiBrands, userType, statusFilter]);

  const rows = useReactMemo<Row[]>(() => {
    return filteredBrands.map((brand: Brand) => ({
      id: String(brand.id),
      name: brand.name,
      status: brand.status,
      publisherShare: `${brand.publisher_share_perc}%`,
      allowAllProducts: brand.allow_all_products ? 'Yes' : 'No',
      customId: brand.custom_id,
    }));
  }, [filteredBrands]);

  type CellArgs = { row: { original: Row } };
  const columns: Array<{ header: string; accessorKey: keyof Row; cell?: (args: CellArgs) => React.ReactElement }> = [
    {
      header: 'Brand Name',
      accessorKey: 'name',
      cell: ({ row }) => {
        const name: string = row?.original?.name ?? '';
        const brandId: string = row?.original?.id ?? '';
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
            <Link href={`/brand/${brandId}`} style={{ textDecoration: 'none', color: carterColors['links-blue'], fontWeight: 500 }}>
              {name}
            </Link>
          </div>
        );
      },
    },
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
    { header: 'Publisher Share', accessorKey: 'publisherShare' },
    { header: 'Allow All Products', accessorKey: 'allowAllProducts' },
    { header: 'Custom ID', accessorKey: 'customId' },
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
          placeholder="Search for Brand"
          data-testid="brand-search-input"
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
          fallback={{ title: 'No Brands Yet', description: 'Click "+ New Brand" to create' }}
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
        <BrandCardView
          brands={filteredBrands.map((b) => ({
            id: Number(b.id),
            name: b.name,
            brand_logo_url: b.brand_logo_url,
            status: b.status,
            publisher_share_perc: b.publisher_share_perc,
            allow_all_products: b.allow_all_products,
            custom_id: b.custom_id,
          }))}
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

export default BrandListing;