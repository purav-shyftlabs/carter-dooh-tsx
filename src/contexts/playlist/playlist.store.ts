import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Playlist, PlaylistItem } from '@/types/playlist';

type PlaylistState = {
  playlist: Playlist;
  addItem: (item: Omit<PlaylistItem, 'id' | 'order' | 'duration'> & Partial<Pick<PlaylistItem, 'duration'>>) => string;
  updateDuration: (id: string, duration: number) => void;
  updateItem: (id: string, updates: Partial<Pick<PlaylistItem, 'name' | 'duration' | 'availability'>>) => void;
  removeItem: (id: string) => void;
  reorder: (sourceIndex: number, destinationIndex: number) => void;
  setName: (name: string) => void;
  clear: () => void;
  load: (playlist: Playlist) => void;
};

const DEFAULT_IMAGE_DURATION = 10;

const withReindexedOrders = (items: PlaylistItem[]): PlaylistItem[] =>
  items.map((it, idx) => ({ ...it, order: idx }));

export const usePlaylistStore = create<PlaylistState>()(
  persist(
    (set, get) => ({
      playlist: { id: 'local', name: 'Untitled Playlist', items: [] },

      addItem: (incoming) => {
        const state = get();
        const nextIndex = state.playlist.items.length;
        const duration = typeof incoming.duration === 'number' && incoming.duration > 0
          ? incoming.duration
          : (incoming.type === 'image' ? DEFAULT_IMAGE_DURATION : DEFAULT_IMAGE_DURATION);
        const id = (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2)}`);
        const item: PlaylistItem = {
          id,
          assetId: incoming.assetId,
          type: incoming.type,
          url: incoming.url,
          thumbnailUrl: incoming.thumbnailUrl,
          name: incoming.name,
          duration,
          order: nextIndex,
        };
        set({
          playlist: {
            ...state.playlist,
            items: [...state.playlist.items, item],
          },
        });
        return id;
      },

      updateDuration: (id, duration) => {
        const state = get();
        const sanitized = Number.isFinite(duration) && duration >= 1 ? Math.floor(duration) : 1;
        set({
          playlist: {
            ...state.playlist,
            items: state.playlist.items.map(i => i.id === id ? { ...i, duration: sanitized } : i),
          },
        });
      },

      updateItem: (id, updates) => {
        const state = get();
        set({
          playlist: {
            ...state.playlist,
            items: state.playlist.items.map(i => i.id === id ? { ...i, ...updates } : i),
          },
        });
      },

      removeItem: (id) => {
        const state = get();
        const filtered = state.playlist.items.filter(i => i.id !== id);
        set({
          playlist: {
            ...state.playlist,
            items: withReindexedOrders(filtered),
          },
        });
      },

      reorder: (sourceIndex, destinationIndex) => {
        const state = get();
        const items = [...state.playlist.items];
        const [moved] = items.splice(sourceIndex, 1);
        items.splice(destinationIndex, 0, moved);
        set({
          playlist: {
            ...state.playlist,
            items: withReindexedOrders(items),
          },
        });
      },

      setName: (name) => {
        const state = get();
        set({ playlist: { ...state.playlist, name } });
      },

      clear: () => set({ playlist: { id: 'local', name: 'Untitled Playlist', items: [] } }),

      load: (playlist) => set({ playlist: { ...playlist, items: withReindexedOrders(playlist.items ?? []) } }),
    }),
    {
      name: 'playlist-store',
      partialize: (state) => ({ playlist: state.playlist }),
    }
  )
);

export default usePlaylistStore;


