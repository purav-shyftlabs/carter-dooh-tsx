import api from '../api/api-client';
import type { Playlist } from '@/types/playlist';

class PlaylistRenderService {
  private renderUrl = '/playlists/render';
  private createUrl = '/playlists';

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

  async createPlaylist(payload: { name: string; description?: string; playlist: unknown }): Promise<{ id: string | number }> {
    const response = await api.post(this.createUrl, payload);
    return response.data;
  }
}

export const playlistRenderService = new PlaylistRenderService();
export default playlistRenderService;


