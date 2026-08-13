import { create } from 'zustand';
import { fetchAbmWiseTvaData, AbmWiseTvaItem } from '../api/targetVsAchievementApi';

export interface AbmWiseState {
  data: AbmWiseTvaItem[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  searchQuery: string;

  setSearchQuery: (query: string) => void;
  clearSearchQuery: () => void;
  loadData: (token: string | null, isRefresh?: boolean) => Promise<void>;
  onRefresh: (token: string | null) => Promise<void>;
}

export const useAbmWiseStore = create<AbmWiseState>((set, get) => ({
  data: [],
  loading: false,
  refreshing: false,
  error: null,
  searchQuery: '',

  setSearchQuery: (query) => set({ searchQuery: query }),
  clearSearchQuery: () => set({ searchQuery: '' }),

  loadData: async (token, isRefresh = false) => {
    try {
      if (isRefresh) {
        set({ refreshing: true });
      } else {
        set({ loading: true });
      }
      set({ error: null });

      const list = await fetchAbmWiseTvaData(token);
      set({ data: Array.isArray(list) ? list : [] });
    } catch (err: any) {
      set({ error: 'Failed to load ABM wise report data' });
    } finally {
      set({ loading: false, refreshing: false });
    }
  },

  onRefresh: async (token) => {
    await get().loadData(token, true);
  },
}));
