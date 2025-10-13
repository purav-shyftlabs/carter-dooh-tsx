import React, { useState, useEffect } from "react";
import InternalLayout from "@/layouts/internal-layout";
import PageHeader from "@/components/page-header/page-header.component";
import { Button } from "shyftlabs-dsl";
import { PlusIcon, AppWindow, PanelLeft as PanelLeftIcon } from "@/lib/icons";
import { useRouter } from "next/router";
import ROUTES from "@/common/routes";
import styles from "@/modules/users/styles/users.module.scss";
import { CarterTabs } from "shyftlabs-dsl";
import useTabChangeHelper from "@/common/hooks/tab-change.hook";
import { useAppSelector } from "@/redux/hooks";
import useUser from "@/contexts/user-data/user-data.hook";
import { AccessLevel, PermissionType } from "@/types";
import PlaylistListing from "@/modules/playlist/component/playlist-listing.component";
import { CarterTabType } from "shyftlabs-dsl";
import { checkAclFromState } from "@/common/acl";

// Playlist page info
const PlaylistPageInfo = {
  title: 'Playlists',
  actionButton: 'New Playlist',
  all: {
    label: 'All',
    tab: 'all'
  },
  archived: {
    label: 'Archived',
    tab: 'archived'
  }
};

// Allow data-testid for testing without affecting library types
type CarterTabWithTestId = CarterTabType & { 'data-testid'?: string };

const Playlist = () => {
    const router = useRouter();
    const { permission, isLoading } = useUser();
    const { currentTab, handleTabChange } = useTabChangeHelper();
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    const [isMounted, setIsMounted] = useState(false);
    
  const tabs: CarterTabWithTestId[] = [
        {
          title: PlaylistPageInfo.all.label,
      component: (_props: unknown) => <PlaylistListing playlistType="all" viewMode={viewMode} />,
          additionalData: {
            playlistType: 'all',
          },
          'data-testid': 'playlist-all-tab',
        },
        {
          title: PlaylistPageInfo.archived.label,
      component: (_props: unknown) => <PlaylistListing playlistType="archived" viewMode={viewMode} />,
          additionalData: {
            playlistType: 'archived',
          },
          'data-testid': 'playlist-archived-tab',
        },
      ];
      
      const hasFullAccessFromRedux = useAppSelector(state =>
        checkAclFromState(state, PermissionType.UserManagement, AccessLevel.FULL_ACCESS)
      );
      
      const flags = (permission as Record<string, unknown> | null | undefined)?.USER_MANAGEMENT as
        | Record<string, unknown>
        | null
        | undefined;
      const hasFullAccessFromFlags = Boolean(flags && (flags as { fullAccess?: boolean }).fullAccess);
      const hasFullAccess = Boolean(hasFullAccessFromRedux || hasFullAccessFromFlags);

      // Prevent hydration mismatch by only showing permission-dependent content after mount
      useEffect(() => {
        setIsMounted(true);
      }, []);
  return <>
      <PageHeader
        title={PlaylistPageInfo.title}
        ActionComponent={() => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className={styles.button_group_container}>
              <Button
                size="small"
                variant={viewMode === 'table' ? 'primary' : 'tertiary'}
                icon={<PanelLeftIcon />}
                onClick={() => setViewMode('table')}
                label="Table"
                iconPosition="left"
              />
              <Button
                size="small"
                variant={viewMode === 'grid' ? 'primary' : 'tertiary'}
                icon={<AppWindow />}
                onClick={() => setViewMode('grid')}
                label="Grid"
                iconPosition="left"
              />
            </div>
            {isMounted && hasFullAccess ? (
              <Button
                label={PlaylistPageInfo.actionButton}
                iconPosition="left"
                size="small"
                icon={<PlusIcon />}
                onClick={() => {
                  router.push({
                    pathname: ROUTES.PLAYLIST.ADD
                  });
                }}
              />
            ) : null}
          </div>
        )}
      />
      {!isLoading && (
    <div className={styles.container}>
          <CarterTabs 
            tabs={tabs} 
            noPadding 
            variant="off-white" 
            activeTab={currentTab} 
            onChange={handleTabChange}
          />
        </div>
      )}
  </>;
};
Playlist.getLayout = (page: React.ReactNode) => <InternalLayout head={{ title: 'Playlist Builder', description: 'Playlist Builder' }}>{page}</InternalLayout>;
export default Playlist;
