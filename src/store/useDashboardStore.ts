import { create } from 'zustand';
import {
  fetchStockCashDepositAbmWiseApi,
  fetchBrandWiseSalesDataApi,
  fetchBrandWiseSalesTotalsApi,
  fetchAllStatesApi,
  CashDepositAbmItem,
  BrandWiseSaleItem,
  BrandWiseSalesTotals,
} from '../api/dashboardApi';

export type DashboardTab = 'CASH_DEPOSIT' | 'BRAND_WISE';

export const getTodayDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export interface DashboardState {
  // Active Tab
  activeTab: DashboardTab;

  // Data
  cashDepositList: CashDepositAbmItem[];
  brandSalesList: BrandWiseSaleItem[];
  brandSalesTotals: BrandWiseSalesTotals | null;
  apiStatesList: string[];
  loading: boolean;
  refreshing: boolean;

  // ABM Filter
  abmSearchQuery: string;
  selectedState: string;
  isStateModalOpen: boolean;

  // Brand Wise Filter
  brandSearchQuery: string;
  selectedDate: string;
  isDateModalOpen: boolean;
  calendarYear: number;
  calendarMonth: number;

  // Setters & Actions
  setActiveTab: (tab: DashboardTab) => void;
  setAbmSearchQuery: (query: string) => void;
  setSelectedState: (state: string) => void;
  setIsStateModalOpen: (isOpen: boolean) => void;
  setBrandSearchQuery: (query: string) => void;
  setSelectedDate: (date: string) => void;
  setIsDateModalOpen: (isOpen: boolean) => void;
  setCalendarYear: (updater: number | ((prev: number) => number)) => void;
  setCalendarMonth: (updater: number | ((prev: number) => number)) => void;

  // Business Actions
  resetFilters: () => void;
  handleTabChange: (newTab: DashboardTab) => void;
  loadStatesDropdown: (token: string | null) => Promise<void>;
  loadCashDepositData: (
    token: string | null,
    isRefresh?: boolean,
    stateToFetch?: string
  ) => Promise<void>;
  loadBrandSalesData: (
    token: string | null,
    isRefresh?: boolean,
    stateToFetch?: string,
    dateToFetch?: string,
    brandToFetch?: string
  ) => Promise<void>;
  onRefresh: (token: string | null) => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  // Initial States
  activeTab: 'CASH_DEPOSIT',
  cashDepositList: [],
  brandSalesList: [],
  brandSalesTotals: null,
  apiStatesList: [],
  loading: false,
  refreshing: false,

  abmSearchQuery: '',
  selectedState: 'All States',
  isStateModalOpen: false,

  brandSearchQuery: '',
  selectedDate: getTodayDateString(),
  isDateModalOpen: false,
  calendarYear: new Date().getFullYear(),
  calendarMonth: new Date().getMonth(),

  // Setters
  setActiveTab: (tab) => set({ activeTab: tab }),
  setAbmSearchQuery: (query) => set({ abmSearchQuery: query }),
  setSelectedState: (state) => set({ selectedState: state }),
  setIsStateModalOpen: (isOpen) => set({ isStateModalOpen: isOpen }),
  setBrandSearchQuery: (query) => set({ brandSearchQuery: query }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setIsDateModalOpen: (isOpen) => set({ isDateModalOpen: isOpen }),
  setCalendarYear: (updater) =>
    set((state) => ({
      calendarYear:
        typeof updater === 'function' ? updater(state.calendarYear) : updater,
    })),
  setCalendarMonth: (updater) =>
    set((state) => ({
      calendarMonth:
        typeof updater === 'function' ? updater(state.calendarMonth) : updater,
    })),

  // Reset all filters and search queries to default
  resetFilters: () => {
    const todayStr = getTodayDateString();
    set({
      selectedState: 'All States',
      abmSearchQuery: '',
      brandSearchQuery: '',
      brandSalesTotals: null,
      selectedDate: todayStr,
      calendarYear: new Date().getFullYear(),
      calendarMonth: new Date().getMonth(),
    });
  },

  // Handle Tab Switching
  handleTabChange: (newTab) => {
    const { activeTab } = get();
    if (newTab === activeTab) return;
    const todayStr = getTodayDateString();
    set({
      selectedState: 'All States',
      abmSearchQuery: '',
      brandSearchQuery: '',
      brandSalesTotals: null,
      selectedDate: todayStr,
      calendarYear: new Date().getFullYear(),
      calendarMonth: new Date().getMonth(),
      activeTab: newTab,
    });
  },

  // Load States list from API
  loadStatesDropdown: async (token) => {
    try {
      const states = await fetchAllStatesApi(token);
      if (Array.isArray(states) && states.length > 0) {
        set({ apiStatesList: states });
      }
    } catch (err: any) {
      console.warn('useDashboardStore loadStatesDropdown error:', err.message);
    }
  },

  // Fetch Cash Deposit Data
  loadCashDepositData: async (token, isRefresh = false, stateToFetch) => {
    try {
      if (!isRefresh) set({ loading: true });
      const targetState =
        stateToFetch !== undefined ? stateToFetch : get().selectedState;
      const data = await fetchStockCashDepositAbmWiseApi(token, targetState);
      set({ cashDepositList: Array.isArray(data) ? data : [] });
    } catch (err: any) {
      console.warn('useDashboardStore loadCashDepositData error:', err.message);
    } finally {
      set({ loading: false, refreshing: false });
    }
  },

  // Fetch Brand Wise Sales Data & Totals
  loadBrandSalesData: async (
    token,
    isRefresh = false,
    stateToFetch,
    dateToFetch,
    brandToFetch
  ) => {
    try {
      if (!isRefresh) set({ loading: true });
      const targetState =
        stateToFetch !== undefined ? stateToFetch : get().selectedState;
      const targetDate =
        dateToFetch !== undefined ? dateToFetch : get().selectedDate;
      const targetBrand =
        brandToFetch !== undefined ? brandToFetch : get().brandSearchQuery;

      const [salesRes, totalsRes] = await Promise.allSettled([
        fetchBrandWiseSalesDataApi(token, {
          state: targetState,
          date: targetDate,
          brandName: targetBrand,
        }),
        fetchBrandWiseSalesTotalsApi(token, {
          state: targetState,
          date: targetDate,
          brandName: targetBrand,
        }),
      ]);

      const brandSalesList =
        salesRes.status === 'fulfilled' && Array.isArray(salesRes.value)
          ? salesRes.value
          : [];
      const brandSalesTotals =
        totalsRes.status === 'fulfilled' ? totalsRes.value : null;

      set({ brandSalesList, brandSalesTotals });
    } catch (err: any) {
      console.warn('useDashboardStore loadBrandSalesData error:', err.message);
    } finally {
      set({ loading: false, refreshing: false });
    }
  },

  // Refresh current active tab
  onRefresh: async (token) => {
    const { activeTab, selectedState, selectedDate, brandSearchQuery } = get();
    set({ refreshing: true });
    if (activeTab === 'CASH_DEPOSIT') {
      await get().loadCashDepositData(token, true, selectedState);
    } else {
      await get().loadBrandSalesData(
        token,
        true,
        selectedState,
        selectedDate,
        brandSearchQuery
      );
    }
  },
}));
