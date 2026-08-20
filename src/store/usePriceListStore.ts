import { create } from 'zustand';
import {
  fetchVariationsAllApi,
  fetchPriceListReportApi,
  VariationItem,
  ColumnItem,
} from '../api/priceListApi';

export interface PriceListStoreState {
  data: VariationItem[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;

  // Report details state
  reportDetails: ({ columns: ColumnItem[]; data: any[]; timestamp?: string | null; [key: string]: any }) | null;
  detailsLoading: boolean;
  detailsError: string | null;
  selectedDate: string;

  loadData: (token: string | null, isRefresh?: boolean) => Promise<void>;
  onRefresh: (token: string | null) => Promise<void>;
  loadReportDetails: (token: string | null, variationId: string | number, dateToFetch?: string) => Promise<void>;
  setSelectedDate: (date: string) => void;
}

export const usePriceListStore = create<PriceListStoreState>((set, get) => ({
  data: [],
  loading: false,
  refreshing: false,
  error: null,

  reportDetails: null,
  detailsLoading: false,
  detailsError: null,
  selectedDate: '',

  setSelectedDate: (date) => set({ selectedDate: date }),

  loadData: async (token, isRefresh = false) => {
    try {
      if (isRefresh) {
        set({ refreshing: true });
      } else {
        set({ loading: true });
      }
      set({ error: null });

      const list = await fetchVariationsAllApi(token);
      set({ data: Array.isArray(list) ? list : [] });
    } catch (err: any) {
      set({ error: err?.message || 'Failed to load price lists. Please try again.' });
    } finally {
      set({ loading: false, refreshing: false });
    }
  },

  onRefresh: async (token) => {
    await get().loadData(token, true);
  },

  loadReportDetails: async (token, variationId, dateToFetch) => {
    try {
      set({ detailsLoading: true, detailsError: null, reportDetails: null });
      const targetDate = dateToFetch !== undefined ? dateToFetch : get().selectedDate;
      const response = await fetchPriceListReportApi(token, variationId, targetDate || undefined);
      if (response) {
        // Resolve data list from various shapes
        const columns = response.columns || [];
        const rawData = response.data || response.results || [];
        set({ reportDetails: { ...response, columns, data: Array.isArray(rawData) ? rawData : [] } });
      } else {
        set({ detailsError: 'Failed to load report details. Please try again.' });
      }
    } catch (err: any) {
      set({ detailsError: err?.message || 'Failed to load report details. Please try again.' });
    } finally {
      set({ detailsLoading: false });
    }
  },
}));
