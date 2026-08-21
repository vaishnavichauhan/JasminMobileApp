import { create } from 'zustand';
import { fetchOffersApi, OfferItem } from '../api/offersApi';

export interface HomeState {
  offersList: OfferItem[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  quickSearch: string;

  setQuickSearch: (query: string) => void;
  clearQuickSearch: () => void;
  loadOffers: (token: string | null, isRefresh?: boolean) => Promise<void>;
  onRefresh: (token: string | null) => Promise<void>;
}

export const useHomeStore = create<HomeState>((set, get) => ({
  offersList: [],
  loading: false,
  refreshing: false,
  error: null,
  quickSearch: '',

  setQuickSearch: (query) => set({ quickSearch: query }),
  clearQuickSearch: () => set({ quickSearch: '' }),

  loadOffers: async (token, isRefresh = false) => {
    try {
      if (!isRefresh) set({ loading: true });
      set({ error: null });
      const data = await fetchOffersApi(token);
      set({ offersList: Array.isArray(data) ? data : [] });
    } catch (err: any) {
      set({
        error: err?.message || 'Failed to load offers. Please try again.',
        offersList: [],
      });
    } finally {
      set({ loading: false, refreshing: false });
    }
  },

  onRefresh: async (token) => {
    set({ refreshing: true });
    await get().loadOffers(token, true);
  },
}));
