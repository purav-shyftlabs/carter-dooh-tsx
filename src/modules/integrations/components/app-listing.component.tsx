import React, { useState, useEffect, useMemo } from 'react';
import { DataTable, SearchInput } from 'shyftlabs-dsl';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../styles/integrations.module.scss';
import { integrationsService } from '@/services/integrations/integrations.service';
import { App, Integration } from '@/types/integrations';
import { Button } from 'shyftlabs-dsl';
import { ExternalLinkIcon } from 'lucide-react';

type AppListingProps = {
  category?: string;
};

const AppListing: React.FC<AppListingProps> = ({ category }) => {
  const router = useRouter();
  const [pageNo, setPageNo] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apps, setApps] = useState<App[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>(category || '');
  const [connectedAppIds, setConnectedAppIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    let mounted = true;
    const loadApps = async () => {
      try {
        setIsLoading(true);
        const response = await integrationsService.getApps({
          category: selectedCategory || undefined,
          search: search || undefined,
          page: pageNo,
          limit: pageSize,
          is_active: true,
        });
        if (!mounted) return;
        setApps(response.data.items);
        setTotalCount(response.data.pagination.total);
      } catch (error) {
        console.error('Error loading apps:', error);
        setApps([]);
        setTotalCount(0);
      } finally {
        setIsLoading(false);
      }
    };
    loadApps();
    return () => {
      mounted = false;
    };
  }, [pageNo, pageSize, search, selectedCategory]);

  // Load connected integrations once to mark apps as connected
  useEffect(() => {
    let mounted = true;
    const loadIntegrations = async () => {
      try {
        const response = await integrationsService.getIntegrations({
          status: 'connected',
          page: 1,
          limit: 1000,
        });
        if (!mounted) return;
        const ids = new Set<number>();
        (response.data.items || []).forEach((integration: Integration) => {
          if (integration.app_id) ids.add(integration.app_id);
        });
        setConnectedAppIds(ids);
      } catch (error) {
        console.error('Error loading integrations:', error);
        setConnectedAppIds(new Set());
      }
    };
    loadIntegrations();
    return () => {
      mounted = false;
    };
  }, []);

  const columns = useMemo(
    () => [
      {
        accessorKey: 'logo_url',
        header: '',
        cell: ({ row }: { row: { original: App } }) => (
          <div className={styles.logoCell}>
            {row.original.logo_url ? (
              <img src={row.original.logo_url} alt={row.original.name} className={styles.appLogo} />
            ) : (
              <div className={styles.appLogoPlaceholder}>{row.original.name.charAt(0)}</div>
            )}
          </div>
        ),
        size: 60,
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }: { row: { original: App } }) => (
          <div>
            <div className={styles.appName}>
              {row.original.name}
             
            </div>
            <div className={styles.appCategory}>{row.original.category}</div>
            
          </div>
        ),
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }: { row: { original: App } }) => (
          <div className={styles.description}>{row.original.description || 'No description available'}</div>
        ),
      },
      {
        accessorKey: 'auth_type',
        header: 'Auth Type',
        cell: ({ row }: { row: { original: App } }) => (
          <span className={styles.authBadge}>
            {row.original.auth_type?.replace('_', ' ').toUpperCase() || 'N/A'}
          </span>
        ),
      },
      {
        accessorKey: 'actions',
        header: 'Actions',
        cell: ({ row }: { row: { original: App } }) => (
          <div className={styles.actions}>
            <Button
              label={connectedAppIds.has(row.original.id) ? 'Connected' : 'Connect'}
              size="small"
              variant={connectedAppIds.has(row.original.id) ? 'secondary' : 'primary'}
              disabled={connectedAppIds.has(row.original.id)}
              onClick={() => {
                if (!connectedAppIds.has(row.original.id)) {
                  router.push(`/integrations/apps/${row.original.id}`);
                }
              }}
            />
            {row.original.documentation_url && (
              <a
                href={row.original.documentation_url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.docLink}
              >
                <ExternalLinkIcon size={16} />
              </a>
            )}
          </div>
        ),
      },
    ],
    [router, connectedAppIds],
  );

  const categories = useMemo(() => {
    const cats = new Set<string>();
    apps.forEach(app => {
      if (app.category) cats.add(app.category);
    });
    return Array.from(cats).sort();
  }, [apps]);

  return (
    <div className={styles.appListingContainer}>
      <div className={styles.filters}>
        <div className={styles.searchContainer}>
          <SearchInput
            placeholder="Search apps..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setSearch(e.target.value);
              setPageNo(1);
            }}
          />
        </div>
        {categories.length > 0 && (
          <div className={styles.categoryFilter}>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPageNo(1);
              }}
              className={styles.categorySelect}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <DataTable
        data={apps}
        columns={columns}
        loading={isLoading}
        fallback={{ title: 'No Apps Found', description: 'No apps available to display' }}
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

export default AppListing;

