import { create } from 'zustand';
import {
  fetchFinanceBrandReportApi,
  FinanceBrandReportData,
  FinanceBrandRow,
  FinanceBrandItem,
  FinanceMachineItem,
  FinanceCompanyItem,
} from '../api/financeBrandApi';
import { fetchAllStatesApi } from '../api/dashboardApi';

export interface FinanceBrandState {
  data: FinanceBrandReportData;
  rows: FinanceBrandRow[];
  brands: FinanceBrandItem[];
  machines: FinanceMachineItem[];
  companies: FinanceCompanyItem[];
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

export const useFinanceBrandStore = create<FinanceBrandState>((set, get) => ({
  data: { brands: [], machines: [], companies: [], rows: [] },
  rows: [],
  brands: [],
  machines: [],
  companies: [],
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
      console.warn('[Finance Brand Store] loadStatesDropdown error:', err?.message || err);
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
      const reportData = await fetchFinanceBrandReportApi(token, targetState);

      set({
        data: reportData,
        rows: reportData.rows || [],
        brands: reportData.brands || [],
        machines: reportData.machines || [],
        companies: reportData.companies || [],
      });
    } catch (err: any) {
      set({ error: 'Failed to load Finance & Brand report data' });
    } finally {
      set({ loading: false, refreshing: false });
    }
  },

  onRefresh: async (token) => {
    await get().loadData(token, true);
  },
}));
