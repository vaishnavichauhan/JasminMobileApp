import { create } from 'zustand';
import {
  fetchStockCashDepositAllApi,
  StockCashDepositItem,
} from '../api/stockCashDepositApi';
import { fetchAllStatesApi } from '../api/dashboardApi';

export interface StockCashDepositState {
  data: StockCashDepositItem[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  searchQuery: string;
  selectedState: string;
  apiStatesList: string[];

  setSearchQuery: (query: string) => void;
  setSelectedState: (state: string) => void;
  clearSearchQuery: () => void;
  loadStatesDropdown: (token: string | null) => Promise<void>;
  loadData: (
    token: string | null,
    isRefresh?: boolean,
    stateToFetch?: string
  ) => Promise<void>;
  onRefresh: (token: string | null) => Promise<void>;
}

export const useStockCashDepositStore = create<StockCashDepositState>(
  (set, get) => ({
    data: [],
    loading: false,
    refreshing: false,
    error: null,
    searchQuery: '',
    selectedState: 'All States',
    apiStatesList: [],

    setSearchQuery: (query) => set({ searchQuery: query }),
    setSelectedState: (state) => set({ selectedState: state }),
    clearSearchQuery: () => set({ searchQuery: '' }),

    loadStatesDropdown: async (token) => {
      try {
        const states = await fetchAllStatesApi(token);
        if (Array.isArray(states) && states.length > 0) {
          set({ apiStatesList: states });
        }
      } catch (err: any) {
        console.warn('[Stock Cash Deposit Store] loadStatesDropdown error:', err?.message || err);
      }
    },

    loadData: async (token, isRefresh = false, stateToFetch) => {
      try {
        if (isRefresh) {
          set({ refreshing: true });
        } else {
          set({ loading: true });
        }
        set({ error: null });

        const targetState =
          stateToFetch !== undefined ? stateToFetch : get().selectedState;
        const list = await fetchStockCashDepositAllApi(token, targetState);
        set({ data: Array.isArray(list) ? list : [] });
      } catch (err: any) {
        set({ error: err?.message || 'Failed to load Stock vs Cash Deposit report data' });
      } finally {
        set({ loading: false, refreshing: false });
      }
    },

    onRefresh: async (token) => {
      await get().loadData(token, true);
    },
  })
);
