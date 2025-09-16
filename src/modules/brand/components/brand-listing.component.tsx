import React, { useMemo, useState, useMemo as useReactMemo } from 'react';
import { DataTable, SearchInput, PriorityFilters, ColumnToggle } from 'shyftlabs-dsl';
import Link from 'next/link';
import styles from '../styles/user-listing.module.scss';
import { carterColors } from 'shyftlabs-dsl';

// Brand data type based on your table schema
type Brand = {
  id: number;
  account_id: number;
  brand_logo_url: string;
  name: string;
  industry: string;
  status: string;
  publisher_share_perc: number;
  metadata: Record<string, any>;
  allow_all_products: boolean;
  parent_company_id: number;
  custom_id: string;
};

type IBrandListingProps = {
  userType?: string;
};

// Dummy brand data
const dummyBrands: Brand[] = [
  {
    id: 1,
    account_id: 1001,
    brand_logo_url: 'https://via.placeholder.com/50x50/4A90E2/FFFFFF?text=AC',
    name: 'Apple Computers',
    industry: 'Technology',
    status: 'active',
    publisher_share_perc: 15.5,
    metadata: { 
      description: 'Leading technology company', 
      founded: 1976,
      headquarters: 'Cupertino, CA'
    },
    allow_all_products: true,
    parent_company_id: 1,
    custom_id: 'BRAND-001'
  },
  {
    id: 2,
    account_id: 1001,
    brand_logo_url: 'https://via.placeholder.com/50x50/7ED321/FFFFFF?text=MS',
    name: 'Microsoft Corporation',
    industry: 'Technology',
    status: 'active',
    publisher_share_perc: 12.0,
    metadata: { 
      description: 'Software and cloud services', 
      founded: 1975,
      headquarters: 'Redmond, WA'
    },
    allow_all_products: false,
    parent_company_id: 2,
    custom_id: 'BRAND-002'
  },
  {
    id: 3,
    account_id: 1002,
    brand_logo_url: 'https://via.placeholder.com/50x50/F5A623/FFFFFF?text=AM',
    name: 'Amazon',
    industry: 'E-commerce',
    status: 'active',
    publisher_share_perc: 18.75,
    metadata: { 
      description: 'Global e-commerce and cloud computing', 
      founded: 1994,
      headquarters: 'Seattle, WA'
    },
    allow_all_products: true,
    parent_company_id: 3,
    custom_id: 'BRAND-003'
  },
  {
    id: 4,
    account_id: 1001,
    brand_logo_url: 'https://via.placeholder.com/50x50/BD10E0/FFFFFF?text=GO',
    name: 'Google',
    industry: 'Technology',
    status: 'archived',
    publisher_share_perc: 20.0,
    metadata: { 
      description: 'Search engine and advertising', 
      founded: 1998,
      headquarters: 'Mountain View, CA'
    },
    allow_all_products: false,
    parent_company_id: 4,
    custom_id: 'BRAND-004'
  },
  {
    id: 5,
    account_id: 1003,
    brand_logo_url: 'https://via.placeholder.com/50x50/50E3C2/FFFFFF?text=FB',
    name: 'Meta Platforms',
    industry: 'Social Media',
    status: 'active',
    publisher_share_perc: 14.25,
    metadata: { 
      description: 'Social networking and virtual reality', 
      founded: 2004,
      headquarters: 'Menlo Park, CA'
    },
    allow_all_products: true,
    parent_company_id: 5,
    custom_id: 'BRAND-005'
  },
  {
    id: 6,
    account_id: 1002,
    brand_logo_url: 'https://via.placeholder.com/50x50/9013FE/FFFFFF?text=TW',
    name: 'Twitter',
    industry: 'Social Media',
    status: 'archived',
    publisher_share_perc: 8.5,
    metadata: { 
      description: 'Social networking platform', 
      founded: 2006,
      headquarters: 'San Francisco, CA'
    },
    allow_all_products: false,
    parent_company_id: 6,
    custom_id: 'BRAND-006'
  }
];

const BrandListing: React.FC<IBrandListingProps> = ({ userType }) => {
  const [pageNo, setPageNo] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [search, setSearch] = useState<string>('');
  const [industryFilter, setIndustryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});

  const sortBy = 'name';
  const sortDesc = false;
  const sorting = useMemo(() => [{ id: sortBy, desc: sortDesc }], [sortBy, sortDesc]);

  type Row = {
    id: string;
    name: string;
    industry: string;
    status: string;
    publisherShare: string;
    allowAllProducts: string;
    customId: string;
  };

  // Filter and process brand data
  const filteredBrands = useReactMemo(() => {
    let filtered = dummyBrands;

    // Filter by tab type (all vs archived)
    if (userType === 'archived') {
      filtered = filtered.filter(brand => brand.status === 'archived');
    } else if (userType === 'all') {
      filtered = filtered.filter(brand => brand.status === 'active');
    }

    if (search) {
      filtered = filtered.filter(brand => 
        brand.name.toLowerCase().includes(search.toLowerCase()) ||
        brand.industry.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (industryFilter) {
      filtered = filtered.filter(brand => brand.industry === industryFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter(brand => brand.status === statusFilter);
    }

    return filtered;
  }, [userType, search, industryFilter, statusFilter]);

  const rows = useReactMemo<Row[]>(() => {
    return filteredBrands.map((brand: Brand) => ({
      id: String(brand.id),
      name: brand.name,
      industry: brand.industry,
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
            <Link href={`/brands/brand/${brandId}`} style={{ textDecoration: 'none', color: carterColors['links-blue'], fontWeight: 500 }}>
              {name}
            </Link>
          </div>
        );
      },
    },
    { header: 'Industry', accessorKey: 'industry' },
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
  
  const industryOptions: Option[] = useMemo(
    () => [
      { label: 'All Industries', value: '' },
      { label: 'Technology', value: 'Technology' },
      { label: 'E-commerce', value: 'E-commerce' },
      { label: 'Social Media', value: 'Social Media' },
    ],
    []
  );

  const statusOptions: Option[] = useMemo(
    () => [
      { label: 'All Status', value: '' },
      { label: 'Active', value: 'active' },
      { label: 'Archived', value: 'archived' },
    ],
    []
  );

  const industryInitialOption = useMemo(() => industryOptions.find(o => o.value === industryFilter) ?? industryOptions[0], [industryOptions, industryFilter]);
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
          placeholder="Industry"
          initialValue={industryInitialOption as unknown as Option}
          onChange={(selected: { value?: string } | null) => {
            const value = selected?.value ?? '';
            setIndustryFilter(value ?? '');
            setPageNo(1);
          }}
          mode="single"
          options={industryOptions}
          {...({ closeMenuOnSelect: false } as { closeMenuOnSelect: boolean })}
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
          <ColumnToggle
            columns={columns}
            enableColumnHiding
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={handleColumnVisibilityChange}
          />
        </div>
      </div>
      <DataTable
        loading={false}
        columns={visibleColumns}
        data={rows}
        fallback={{ title: 'No Brands Yet', description: 'Click "+ New Brand" to create' }}
        pagination={{
          pageNo: pageNo,
          pageSize: pageSize,
          totalCount: filteredBrands.length,
          sort: sorting,
        }}
        onPaginationChange={(nextPageNo, nextPageSize, nextSort) => {
          setPageNo(Number(nextPageNo));
          setPageSize(Number(nextPageSize));
        }}
      />
    </div>
  );
};

export default BrandListing;