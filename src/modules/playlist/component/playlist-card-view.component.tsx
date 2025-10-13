import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { carterColors } from 'shyftlabs-dsl';
import { Play, Edit, Trash2, Eye, MoreVertical } from 'lucide-react';
import type { PlaylistListItem } from '@/services/content/playlist.service';

type CardPlaylist = PlaylistListItem;

type IPlaylistCardViewProps = {
  playlists: CardPlaylist[];
  loading: boolean;
  pageNo: number;
  pageSize: number;
  totalCount: number;
  onPaginationChange: (pageNo: number, pageSize: number) => void;
};

// Card view component
const PlaylistCard: React.FC<{ playlist: CardPlaylist }> = ({ playlist }) => {
  const router = useRouter();
  const isActive = playlist.status === 'active';
  const isArchived = playlist.status === 'archived';
  
  let statusBgColor, statusColor;
  if (isActive) {
    statusBgColor = '#E8F5E8';
    statusColor = '#2E7D32';
  } else if (isArchived) {
    statusBgColor = '#FFF3E0';
    statusColor = '#F57C00';
  } else {
    statusBgColor = '#FFEBEE';
    statusColor = '#C62828';
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div style={{
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      padding: 0,
      backgroundColor: 'white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      transition: 'box-shadow 0.2s ease',
      cursor: 'pointer',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    }}
    onClick={() => {
      router.push(`/playlist/${playlist.id}`);
    }}
    >
      {/* Playlist preview on top */}
      <div style={{ width: '100%', height: 160, backgroundColor: '#eef2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#90a4ae', fontWeight: 600 }}>
        <div style={{ textAlign: 'center' }}>
          {playlist.thumbnail_url ? (
            <img src={playlist.thumbnail_url} alt={playlist.name} style={{ height:"100%", width:"100%", maxHeight:"160px" }} />
          ) : (
            <>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎵</div>
            <div style={{ fontSize: '14px' }}>Playlist</div>
            </>
          ) }
        </div>
      </div>

      {/* Details below */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px 0 16px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ 
            color: carterColors['links-blue'], 
            fontWeight: 600,
            fontSize: '16px',
            marginBottom: '4px'
          }}>
            {playlist.name}
          </div>
          <div style={{ 
            color: '#666',
            fontSize: '14px',
            lineHeight: '1.4',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {playlist.description || 'No description'}
          </div>
        </div>
      </div>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px 16px 16px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', color: '#666' }}>Status:</span>
          <span 
            style={{ 
              padding: '4px 8px', 
              borderRadius: '12px', 
              fontSize: '12px',
              fontWeight: '500',
              backgroundColor: statusBgColor,
              color: statusColor
            }}
          >
            {playlist.status.charAt(0).toUpperCase() + playlist.status.slice(1)}
          </span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', color: '#666' }}>Items:</span>
          <span style={{ fontSize: '14px', fontWeight: '500' }}>{playlist.total_items} items</span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', color: '#666' }}>Duration:</span>
          <span style={{ fontSize: '14px', fontWeight: '500' }}>{formatDuration(playlist.duration_seconds)}</span>
        </div>
        
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', color: '#666' }}>Created:</span>
          <span style={{ fontSize: '14px', fontWeight: '500' }}>{formatDate(playlist.created_at)}</span>
        </div>
      </div>
    </div>
  );
};

const PlaylistCardView: React.FC<IPlaylistCardViewProps> = ({ 
  playlists, 
  loading, 
  pageNo, 
  pageSize, 
  totalCount, 
  onPaginationChange 
}) => {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        Loading playlists...
      </div>
    );
  }

  if (playlists.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h3>No Playlists Yet</h3>
        <p>Click + New Playlist to create</p>
      </div>
    );
  }

  return (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '16px',
        marginBottom: '20px'
      }}>
        {playlists.map((playlist: CardPlaylist) => (
          <PlaylistCard key={playlist.id} playlist={playlist} />
        ))}
      </div>
      
      {/* Simple pagination for grid view */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        gap: '16px',
        padding: '20px 0'
      }}>
        <button
          style={{
            padding: '8px 16px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: 'white',
            cursor: pageNo <= 1 ? 'not-allowed' : 'pointer',
            opacity: pageNo <= 1 ? 0.5 : 1
          }}
          disabled={pageNo <= 1}
          onClick={() => onPaginationChange(pageNo - 1, pageSize)}
        >
          Previous
        </button>
        <span style={{ fontSize: '14px' }}>
          Page {pageNo} of {Math.ceil(totalCount / pageSize)}
        </span>
        <button
          style={{
            padding: '8px 16px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: 'white',
            cursor: pageNo >= Math.ceil(totalCount / pageSize) ? 'not-allowed' : 'pointer',
            opacity: pageNo >= Math.ceil(totalCount / pageSize) ? 0.5 : 1
          }}
          disabled={pageNo >= Math.ceil(totalCount / pageSize)}
          onClick={() => onPaginationChange(pageNo + 1, pageSize)}
        >
          Next
        </button>
      </div>
    </>
  );
};

export default PlaylistCardView;
