import React, { useMemo, useState, useMemo as useReactMemo } from 'react';
import { DataTable, SearchInput, PriorityFilters, ColumnToggle } from 'shyftlabs-dsl';
import Link from 'next/link';
import styles from '../styles/user-listing.module.scss';
import { carterColors } from 'shyftlabs-dsl';

// Brand data type based on your table schema
type Content = {
  id: number;
  account_id: number;
  brand_logo_url: string;
  name: string;
  type: string;
  location: string;
  publisher_share_perc: number;
  metadata: Record<string, unknown>;
  allow_all_products: boolean;
  parent_company_id: number;
  custom_id: string;
  owner: string;
};

type IContentListingProps = {
  userType?: string;
};

// Dummy brand data
const dummyContents: Content[] = [
  {
    id: 1,
    account_id: 1001,
    brand_logo_url: 'https://via.placeholder.com/50x50/4A90E2/FFFFFF?text=AC',
    name: 'Apple Computers',
    type: 'Technology',
    location: 'active',
    publisher_share_perc: 15.5,
    metadata: { 
      description: 'Leading technology company', 
      founded: 1976,
      headquarters: 'Cupertino, CA'
    },
    allow_all_products: true,
    parent_company_id: 1,
    custom_id: 'BRAND-001',
    owner: 'Owner 1'
  },
  {
    id: 2,
    account_id: 1001,
    brand_logo_url: 'https://via.placeholder.com/50x50/7ED321/FFFFFF?text=MS',
    name: 'Microsoft Corporation',
    type: 'Technology',
    location: 'active',
    publisher_share_perc: 12.0,
    metadata: { 
      description: 'Software and cloud services', 
      founded: 1975,
      headquarters: 'Redmond, WA'
    },
    allow_all_products: false,
    parent_company_id: 2,
    custom_id: 'BRAND-002',
    owner: 'Owner 2'
  },
  {
    id: 3,
    account_id: 1002,
    brand_logo_url: 'https://via.placeholder.com/50x50/F5A623/FFFFFF?text=AM',
    name: 'Amazon',
    type: 'E-commerce',
    location: 'active',
    publisher_share_perc: 18.75,
    metadata: { 
      description: 'Global e-commerce and cloud computing', 
      founded: 1994,
      headquarters: 'Seattle, WA'
    },
    allow_all_products: true,
    parent_company_id: 3,
    custom_id: 'BRAND-003',
    owner: 'Owner 3'
  },
  {
    id: 4,
    account_id: 1001,
    brand_logo_url: 'https://via.placeholder.com/50x50/BD10E0/FFFFFF?text=GO',
    name: 'Google',
    type: 'Technology',
    location: 'archived',
    publisher_share_perc: 20.0,
    metadata: { 
      description: 'Search engine and advertising', 
      founded: 1998,
      headquarters: 'Mountain View, CA'
    },
    allow_all_products: false,
    parent_company_id: 4,
    custom_id: 'BRAND-004',
    owner: 'Owner 4'
  },
  {
    id: 5,
    account_id: 1003,
    brand_logo_url: 'https://via.placeholder.com/50x50/50E3C2/FFFFFF?text=FB',
    name: 'Meta Platforms',
    type: 'Social Media',
    location: 'active',
    publisher_share_perc: 14.25,
    metadata: { 
      description: 'Social networking and virtual reality', 
      founded: 2004,
      headquarters: 'Menlo Park, CA'
    },
    allow_all_products: true,
    parent_company_id: 5,
    custom_id: 'BRAND-005',
    owner: 'Owner 5'
  },
  {
    id: 6,
    account_id: 1002,
    brand_logo_url: 'https://via.placeholder.com/50x50/9013FE/FFFFFF?text=TW',
    name: 'Twitter',
    type: 'Social Media',
    location: 'archived',
    publisher_share_perc: 8.5,
    metadata: { 
      description: 'Social networking platform', 
      founded: 2006,
      headquarters: 'San Francisco, CA'
    },
    allow_all_products: false,
    parent_company_id: 6,
    custom_id: 'BRAND-006',
    owner: 'Owner 6'
  }
];

const ContentListing: React.FC<IContentListingProps> = ({ userType }) => {
  const [pageNo, setPageNo] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [search, setSearch] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  const [ownerFilter, setOwnerFilter] = useState<string>('');
  const sortBy = 'name';
  const sortDesc = false;
  const sorting = useMemo(() => [{ id: sortBy, desc: sortDesc }], [sortBy, sortDesc]);

  type Row = {
    id: string;
    name: string;
    type: string;
    location: string;
    publisherShare: string;
    allowAllProducts: string;
    customId: string;
    owner: string;
    parentCompany: string;
  };

  // Filter and process brand data
  const filteredContents = useReactMemo(() => {
    let filtered = dummyContents;

    // Filter by tab type (all vs archived)
    if (userType === 'archived') {
      filtered = filtered.filter(content => content.location === 'archived');
    } else if (userType === 'all') {
      filtered = filtered.filter(content => content.location === 'active');
    }

    if (search) {
      filtered = filtered.filter(content => 
        content.name.toLowerCase().includes(search.toLowerCase()) ||
        content.type.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (typeFilter) {
      filtered = filtered.filter(content => content.type === typeFilter);
    }

    if (locationFilter) {
      filtered = filtered.filter(content => content.location === locationFilter);
    }

    if (ownerFilter) {
      filtered = filtered.filter(content => content.owner === ownerFilter);
    }

    return filtered;
    }, [userType, search, typeFilter, locationFilter, ownerFilter]);

  const rows = useReactMemo<Row[]>(() => {
    return filteredContents.map((content: Content) => ({
      id: String(content.id),
      name: content.name,
      type: content.type,
      location: content.location,
      publisherShare: `${content.publisher_share_perc}%`,
      allowAllProducts: content.allow_all_products ? 'Yes' : 'No',
      customId: content.custom_id,
      owner: content.owner,
      parentCompany: content.parent_company_id.toString(),
    }));
  }, [filteredContents]);

  type CellArgs = { row: { original: Row } };
  const columns: Array<{ header: string; accessorKey: keyof Row; cell?: (args: CellArgs) => React.ReactElement }> = [
    {
      header: 'Content Name',
      accessorKey: 'name',
      cell: ({ row }) => {
        const name: string = row?.original?.name ?? '';
        const contentId: string = row?.original?.id ?? '';
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
            <Link href={`/contents/content/${contentId}`} style={{ textDecoration: 'none', color: carterColors['links-blue'], fontWeight: 500 }}>
              {name}
            </Link>
          </div>
        );
      },
    },
    { header: 'Type', accessorKey: 'type' },
    { 
      header: 'Location', 
      accessorKey: 'location',
      cell: ({ row }) => {
        const location = row?.original?.location ?? '';
        const isActive = location === 'active';
        const isArchived = location === 'archived';
        
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
            {location.charAt(0).toUpperCase() + location.slice(1)}
          </span>
        );
      }
    },
    { header: 'Publisher Share', accessorKey: 'publisherShare' },
    { header: 'Allow All Products', accessorKey: 'allowAllProducts' },
    { header: 'Custom ID', accessorKey: 'customId' },
    { header: 'Owner', accessorKey: 'owner' },
    { header: 'Parent Company', accessorKey: 'parentCompany' },
  ];

  const visibleColumns = useReactMemo(() => {
    if (!columnVisibility || Object.keys(columnVisibility).length === 0) return columns;
    return columns.filter((c) => columnVisibility[c.accessorKey] !== false);
  }, [columns, columnVisibility]);

  type Option = { label: string; value: string };
  
  const typeOptions: Option[] = useMemo(
    () => [
      { label: 'All Types', value: '' },
      { label: 'Technology', value: 'Technology' },
      { label: 'E-commerce', value: 'E-commerce' },
      { label: 'Social Media', value: 'Social Media' },
    ],
    []
  );

  const locationOptions: Option[] = useMemo(
    () => [
      { label: 'All Location', value: '' },
      { label: 'Active', value: 'active' },
      { label: 'Archived', value: 'archived' },
      { label: 'Inactive', value: 'inactive' },
      { label: 'Pending', value: 'pending' },
      { label: 'Suspended', value: 'suspended' }
    ],
    []
  );

  const ownerOptions: Option[] = useMemo(
    () => [
      { label: 'All Owners', value: '' },
      { label: 'Owner 1', value: 'owner1' },
      { label: 'Owner 2', value: 'owner2' },
      { label: 'Owner 3', value: 'owner3' },
    ],
    []
  );

  const typeInitialOption = useMemo(() => typeOptions.find(o => o.value === typeFilter) ?? typeOptions[0], [typeOptions, typeFilter]);
  const locationInitialOption = useMemo(() => locationOptions.find(o => o.value === locationFilter) ?? locationOptions[0], [locationOptions, locationFilter]);
  const ownerInitialOption = useMemo(() => ownerOptions.find(o => o.value === ownerFilter) ?? ownerOptions[0], [ownerOptions, ownerFilter]);
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
          placeholder="Search for Content"
          data-testid="content-search-input"
        />
        <PriorityFilters
          placeholder="Type"
          initialValue={typeInitialOption as unknown as Option}
          onChange={(selected: { value?: string } | null) => {
            const value = selected?.value ?? '';
            setTypeFilter(value ?? '');
            setPageNo(1);
          }}
          mode="single"
          options={typeOptions}
          {...({ closeMenuOnSelect: false } as { closeMenuOnSelect: boolean })}
        />
        <PriorityFilters
          placeholder="Location"
          mode="single"
          initialValue={locationInitialOption as unknown as { label: string; value: string }}
          onChange={(selected: { value?: string } | null) => {
            const value = selected?.value ?? '';
            setLocationFilter(value ?? '');
            setPageNo(1);
          }}
          options={locationOptions}
          {...({ closeMenuOnSelect: false } as { closeMenuOnSelect: boolean })}
        />
        <PriorityFilters
          placeholder="Owner"
          mode="single"
          initialValue={ownerInitialOption as unknown as { label: string; value: string }}
          onChange={(selected: { value?: string } | null) => {
            const value = selected?.value ?? '';
            setOwnerFilter(value ?? '');
            setPageNo(1);
          }}
          options={ownerOptions}
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
        fallback={{ title: 'No Contents Yet', description: 'Click "+ New Content" to create' }}
        pagination={{
          pageNo: pageNo,
          pageSize: pageSize,
          totalCount: filteredContents.length,
          sort: sorting,
        }}
        onPaginationChange={(nextPageNo, nextPageSize) => {
          setPageNo(Number(nextPageNo));
          setPageSize(Number(nextPageSize));
        }}
      />
    </div>
  );
};

export default ContentListing;