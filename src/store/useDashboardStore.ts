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
  apiZonesList: string[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;

  // Filters
  abmSearchQuery: string;
  selectedState: string;
  selectedStates: string[];
  selectedZones: string[];
  isStateModalOpen: boolean;
  isFilterModalOpen: boolean;
  filterModalActiveTab: 'STATE' | 'ZONE';

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
  setSelectedStates: (states: string[]) => void;
  setSelectedZones: (zones: string[]) => void;
  toggleSelectedState: (state: string) => void;
  toggleSelectedZone: (zone: string) => void;
  selectAllStates: () => void;
  selectAllZones: () => void;
  setIsStateModalOpen: (isOpen: boolean) => void;
  setIsFilterModalOpen: (isOpen: boolean) => void;
  setFilterModalActiveTab: (tab: 'STATE' | 'ZONE') => void;
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
    stateToFetch?: string | string[]
  ) => Promise<void>;
  loadBrandSalesData: (
    token: string | null,
    isRefresh?: boolean,
    statesToFetch?: string[] | string,
    zonesToFetch?: string[] | string,
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
  apiZonesList: [],
  loading: false,
  refreshing: false,
  error: null,

  abmSearchQuery: '',
  selectedState: 'All States',
  selectedStates: [],
  selectedZones: [],
  isStateModalOpen: false,
  isFilterModalOpen: false,
  filterModalActiveTab: 'STATE',

  brandSearchQuery: '',
  selectedDate: getTodayDateString(),
  isDateModalOpen: false,
  calendarYear: new Date().getFullYear(),
  calendarMonth: new Date().getMonth(),

  // Setters
  setActiveTab: (tab) => set({ activeTab: tab }),
  setAbmSearchQuery: (query) => set({ abmSearchQuery: query }),
  setSelectedState: (state) =>
    set({
      selectedState: state,
      selectedStates: state && state !== 'All States' ? [state] : [],
    }),
  setSelectedStates: (states) =>
    set({
      selectedStates: states,
      selectedState:
        states.length === 0
          ? 'All States'
          : states.length === 1
          ? states[0]
          : `${states.length} States`,
    }),
  setSelectedZones: (zones) => set({ selectedZones: zones }),
  toggleSelectedState: (st) => {
    const { selectedStates } = get();
    const exists = selectedStates.includes(st);
    const newStates = exists
      ? selectedStates.filter((item) => item !== st)
      : [...selectedStates, st];
    set({
      selectedStates: newStates,
      selectedState:
        newStates.length === 0
          ? 'All States'
          : newStates.length === 1
          ? newStates[0]
          : `${newStates.length} States`,
    });
  },
  toggleSelectedZone: (zn) => {
    const { selectedZones } = get();
    const exists = selectedZones.includes(zn);
    const newZones = exists
      ? selectedZones.filter((item) => item !== zn)
      : [...selectedZones, zn];
    set({ selectedZones: newZones });
  },
  selectAllStates: () => set({ selectedStates: [], selectedState: 'All States' }),
  selectAllZones: () => set({ selectedZones: [] }),
  setIsStateModalOpen: (isOpen) => set({ isStateModalOpen: isOpen }),
  setIsFilterModalOpen: (isOpen) => set({ isFilterModalOpen: isOpen }),
  setFilterModalActiveTab: (tab) => set({ filterModalActiveTab: tab }),
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
      selectedStates: [],
      selectedZones: [],
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
      selectedStates: [],
      selectedZones: [],
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
      set({ apiStatesList: Array.isArray(states) ? states : [] });
    } catch (err: any) {
      console.warn('useDashboardStore loadStatesDropdown error:', err.message);
      set({ apiStatesList: [] });
    }
  },

  // Fetch Cash Deposit Data
  loadCashDepositData: async (token, isRefresh = false, stateToFetch) => {
    try {
      if (!isRefresh) set({ loading: true });
      set({ error: null });
      const targetState =
        stateToFetch !== undefined
          ? Array.isArray(stateToFetch)
            ? stateToFetch.join(',')
            : stateToFetch
          : get().selectedStates.length > 0
          ? get().selectedStates.join(',')
          : get().selectedState;
      const data = await fetchStockCashDepositAbmWiseApi(token, targetState);
      set({ cashDepositList: Array.isArray(data) ? data : [] });
    } catch (err: any) {
      set({ error: err?.message || 'Failed to load cash deposit data' });
    } finally {
      set({ loading: false, refreshing: false });
    }
  },

  // Fetch Brand Wise Sales Data & Totals
  loadBrandSalesData: async (
    token,
    isRefresh = false,
    statesToFetch,
    zonesToFetch,
    dateToFetch,
    brandToFetch
  ) => {
    try {
      if (!isRefresh) set({ loading: true });
      set({ error: null });
      const targetStates =
        statesToFetch !== undefined
          ? statesToFetch
          : get().selectedStates.length > 0
          ? get().selectedStates
          : get().selectedState !== 'All States'
          ? get().selectedState
          : undefined;

      const targetZones =
        zonesToFetch !== undefined
          ? zonesToFetch
          : get().selectedZones.length > 0
          ? get().selectedZones
          : undefined;

      const targetDate =
        dateToFetch !== undefined ? dateToFetch : get().selectedDate;
      const targetBrand =
        brandToFetch !== undefined ? brandToFetch : get().brandSearchQuery;

      const [salesRes, totalsRes] = await Promise.allSettled([
        fetchBrandWiseSalesDataApi(token, {
          state: targetStates,
          zone: targetZones,
          date: targetDate,
          brandName: targetBrand,
        }),
        fetchBrandWiseSalesTotalsApi(token, {
          state: targetStates,
          zone: targetZones,
          date: targetDate,
          brandName: targetBrand,
        }),
      ]);
      console.log('salesRes', salesRes);

      const brandSalesList =
        salesRes.status === 'fulfilled' && Array.isArray(salesRes.value)
          ? salesRes.value
          : [];
      const brandSalesTotals =
        totalsRes.status === 'fulfilled' ? totalsRes.value : null;

      // Extract states and zones returned from brand-wise sales API if present
      if (salesRes.status === 'fulfilled' && salesRes.value) {
        const resVal: any = salesRes.value;
        if (Array.isArray(resVal.states) && resVal.states.length > 0) {
          const mergedStates = Array.from(
            new Set([...get().apiStatesList, ...resVal.states])
          );
          set({ apiStatesList: mergedStates });
        }
        if (Array.isArray(resVal.zones) && resVal.zones.length > 0) {
          set({ apiZonesList: resVal.zones });
        }
      }

      // Check if salesRes failed with access denied
      if (salesRes.status === 'rejected') {
        const rejErr = (salesRes as any).reason;
        if (rejErr?.message) {
          set({ error: rejErr.message });
        }
      }

      set({ brandSalesList, brandSalesTotals });
    } catch (err: any) {
      set({ error: err?.message || 'Failed to load brand sales data' });
    } finally {
      set({ loading: false, refreshing: false });
    }
  },

  // Refresh current active tab
  onRefresh: async (token) => {
    const {
      activeTab,
      selectedState,
      selectedStates,
      selectedZones,
      selectedDate,
      brandSearchQuery,
    } = get();
    set({ refreshing: true });
    if (activeTab === 'CASH_DEPOSIT') {
      await get().loadCashDepositData(
        token,
        true,
        selectedStates.length > 0 ? selectedStates : selectedState
      );
    } else {
      await get().loadBrandSalesData(
        token,
        true,
        selectedStates,
        selectedZones,
        selectedDate,
        brandSearchQuery
      );
    }
  },
}));
