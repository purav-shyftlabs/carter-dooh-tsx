export type PlaylistContent = {
  type: 'image' | 'video' | 'website';
  name: string;
  image_url?: string;
  video_url?: string;
  website_url?: string;
  duration_seconds: number;
  order_index: number;
  metadata?: {
    alt_text?: string;
    [key: string]: any;
  };
};

export type PlaylistItem = {
  id: string;
  assetId: string;
  type: 'image' | 'video' | 'website';
  url: string;
  duration: number; // seconds
  order: number;
  thumbnailUrl?: string;
  name?: string;
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


