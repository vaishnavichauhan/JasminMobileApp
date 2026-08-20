import { create } from 'zustand';
import { fetchOffersApi, OfferItem } from '../api/offersApi';

export type OfferTab = 'ALL' | 'ACTIVE' | 'EXPIRED';

export interface OffersState {
  activeTab: OfferTab;
  offersList: OfferItem[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  quickSearch: string;
  activeIndex: number;

  setActiveTab: (tab: OfferTab) => void;
  setQuickSearch: (query: string) => void;
  clearQuickSearch: () => void;
  setActiveIndex: (index: number) => void;
  loadOffers: (token: string | null, isRefresh?: boolean) => Promise<void>;
  onRefresh: (token: string | null) => Promise<void>;
}

export const useOffersStore = create<OffersState>((set, get) => ({
  activeTab: 'ALL',
  offersList: [],
  loading: false,
  refreshing: false,
  error: null,
  quickSearch: '',
  activeIndex: 0,

  setActiveTab: (tab) => set({ activeTab: tab, activeIndex: 0 }),
  setQuickSearch: (query) => set({ quickSearch: query, activeIndex: 0 }),
  clearQuickSearch: () => set({ quickSearch: '', activeIndex: 0 }),
  setActiveIndex: (index) => set({ activeIndex: index }),

  loadOffers: async (token, isRefresh = false) => {
    try {
      if (!isRefresh) set({ loading: true });
      set({ error: null });
      const data = await fetchOffersApi(token);
      set({ offersList: Array.isArray(data) ? data : [] });
    } catch (err: any) {
      set({ error: err?.message || 'Failed to load offers. Please try again.' });
    } finally {
      set({ loading: false, refreshing: false });
    }
  },

  onRefresh: async (token) => {
    set({ refreshing: true });
    await get().loadOffers(token, true);
  },
}));
