import api from '../api/api-client';
import type { Playlist } from '@/types/playlist';

export type PlaylistContent = {
  id: number;
  playlist_id: number;
  order_index: number;
  type: 'image' | 'video' | 'website';
  name: string;
  image_url?: string;
  video_url?: string;
  website_url?: string;
  duration_seconds: number;
  metadata?: {
    alt_text?: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
};

export type PlaylistListItem = {
  id: number;
  name: string;
  description: string;
  metadata?: {
    category?: string;
    tags?: string[];
    [key: string]: any;
  };
  thumbnail_url?: string;
  status: string;
  total_items: number;
  duration_seconds: number;
  account_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  contents?: PlaylistContent[];
};

export type PlaylistsResponse = {
  success: boolean;
  message: string;
  data: PlaylistListItem[];
};

export type PlaylistDetailResponse = {
  success: boolean;
  message: string;
  data: PlaylistListItem;
};

export type PlaylistsParams = {
  status?: string;
  limit?: number;
  skip?: number;
  sort?: string;
};

class PlaylistRenderService {
  private renderUrl = '/playlists/render';
  private createUrl = '/playlists';
  private listUrl = '/playlists';

  async renderAndDownload(playlist: Playlist): Promise<void> {
    // Try blob response first (video/mp4)
    try {
      const response = await api.post(this.renderUrl, playlist, { responseType: 'blob' });
      const contentType = (response.headers && (response.headers['content-type'] as string)) || 'video/mp4';
      const blob = new Blob([response.data], { type: contentType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${playlist.name || 'playlist'}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    } catch (e) {
      // fall through to try JSON response
    }

    // Try JSON response with URL
    try {
      const json = await api.post(this.renderUrl, playlist);
      const data = json?.data;
      const url = data?.url || data?.downloadUrl;
      if (url) {
        const a = document.createElement('a');
        a.href = url;
        a.download = `${playlist.name || 'playlist'}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }
    } catch (e) {
      // ignore and throw below
    }

    throw new Error('Render not supported by backend yet.');
  }

  exportAsJson(playlist: Playlist): void {
    const payload = JSON.stringify(playlist, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${playlist.name || 'playlist'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async createPlaylist(payload: { 
    name: string; 
    description?: string; 
    metadata?: { category?: string; tags?: string[] };
    thumbnail_url?: string;
    status?: string;
    contents: Array<{
      type: 'image' | 'video' | 'website';
      name: string;
      image_url?: string;
      video_url?: string;
      website_url?: string;
      duration_seconds: number;
      order_index: number;
      metadata?: { alt_text?: string; [key: string]: any };
    }>;
  }): Promise<{ id: string | number }> {
    const response = await api.post(this.createUrl, payload);
    return response.data;
  }

  async getPlaylists(params: PlaylistsParams = {}): Promise<PlaylistsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.status) queryParams.append('status', params.status);
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.skip) queryParams.append('skip', params.skip.toString());
    if (params.sort) queryParams.append('sort', params.sort);
    
    const url = `${this.listUrl}?${queryParams.toString()}`;
    const response = await api.get(url);
    return response.data;
  }

  async getPlaylistById(id: string | number): Promise<PlaylistListItem> {
    const response = await api.get(`${this.listUrl}/${id}`);
    return response.data.data; // Extract data from wrapped response
  }

  async updatePlaylist(id: string | number, payload: { 
    name: string; 
    description?: string; 
    metadata?: { category?: string; tags?: string[] };
    thumbnail_url?: string;
    status?: string;
    contents?: Array<{
      type: 'image' | 'video' | 'website';
      name: string;
      image_url?: string;
      video_url?: string;
      website_url?: string;
      duration_seconds: number;
      order_index: number;
      metadata?: { alt_text?: string; [key: string]: any };
    }>;
  }): Promise<{ id: string | number }> {
    const response = await api.put(`${this.listUrl}/${id}`, payload);
    return response.data;
  }
}

export const playlistRenderService = new PlaylistRenderService();
export default playlistRenderService;


