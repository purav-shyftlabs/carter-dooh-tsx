export type PlaylistContentType = 'image' | 'video' | 'website' | 'integration';

export type PlaylistContent = {
  id?: number;
  playlist_id?: number;
  type: PlaylistContentType;
  name: string;
  image_url?: string;
  video_url?: string;
  website_url?: string;
  integration_id?: number;
  duration_seconds: number;
  order_index: number;
  metadata?: {
    alt_text?: string;
    [key: string]: any;
  };
  integration?: {
    id: number;
    app_id: number;
    app_name: string;
    app_logo?: string;
    status: string;
    connected_at?: string;
    last_synced_at?: string;
  };
  created_at?: string;
  updated_at?: string;
};

export type PlaylistItem = {
  id: string;
  assetId?: string;
  type: PlaylistContentType;
  url?: string;
  integrationId?: number;
  duration: number; // seconds
  order: number;
  thumbnailUrl?: string;
  name?: string;
  integration?: {
    id: number;
    app_id: number;
    app_name: string;
    app_logo?: string;
    status: string;
  };
};

export type Playlist = {
  id: string;
  name: string;
  description?: string;
  metadata?: {
    category?: string;
    tags?: string[];
    [key: string]: any;
  };
  thumbnail_url?: string;
  status?: string;
  contents: PlaylistContent[];
  items: PlaylistItem[]; // Keep for backward compatibility with existing UI
};


