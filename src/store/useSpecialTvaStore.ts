import { create } from 'zustand';
import {
  fetchSpecialTvaAllApi,
  fetchSpecialTvaReportApi,
  SpecialTvaItem,
  SpecialTvaReportData,
} from '../api/specialTvaApi';

export interface SpecialTvaStoreState {
  data: SpecialTvaItem[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;

  // Report details state
  reportData: SpecialTvaReportData | null;
  reportLoading: boolean;
  reportRefreshing: boolean;
  reportError: string | null;

  loadData: (token?: string | null, isRefresh?: boolean) => Promise<void>;
  onRefresh: (token?: string | null) => Promise<void>;
  loadReportDetails: (
    id: string | number,
    token?: string | null,
    isRefresh?: boolean
  ) => Promise<void>;
  clearReportDetails: () => void;
}

export const useSpecialTvaStore = create<SpecialTvaStoreState>((set, get) => ({
  data: [],
  loading: false,
  refreshing: false,
  error: null,

  reportData: null,
  reportLoading: false,
  reportRefreshing: false,
  reportError: null,

  loadData: async (token, isRefresh = false) => {
    try {
      if (isRefresh) {
        set({ refreshing: true });
      } else {
        set({ loading: true });
      }
      set({ error: null });

      const list = await fetchSpecialTvaAllApi(token);
      set({ data: Array.isArray(list) ? list : [] });
    } catch (err: any) {
      set({
        error: err?.message || 'Failed to load Special TVA reports. Please try again.',
        data: [],
      });
    } finally {
      set({ loading: false, refreshing: false });
    }
  },

  onRefresh: async (token) => {
    await get().loadData(token, true);
  },

  loadReportDetails: async (id, token, isRefresh = false) => {
    try {
      if (isRefresh) {
        set({ reportRefreshing: true });
      } else {
        set({ reportLoading: true, reportError: null });
      }

      const res = await fetchSpecialTvaReportApi(id, token);
      if (res) {
        set({ reportData: res, reportError: null });
      } else {
        set({ reportError: 'Failed to load Special TVA report data.' });
      }
    } catch (err: any) {
      set({
        reportError:
          err?.message || 'Failed to load Special TVA report data. Please try again.',
      });
    } finally {
      set({ reportLoading: false, reportRefreshing: false });
    }
  },

  clearReportDetails: () => {
    set({ reportData: null, reportError: null });
  },
}));
