export type PlaylistItem = {
  id: string;
  assetId: string;
  type: 'image' | 'video';
  url: string;
  duration: number; // seconds
  order: number;
  thumbnailUrl?: string;
  name?: string;
  availability?: {
    enabled: boolean;
    startDate?: string; // ISO date string
    endDate?: string; // ISO date string
  };
};

export type Playlist = {
  id: string;
  name: string;
  items: PlaylistItem[];
};


