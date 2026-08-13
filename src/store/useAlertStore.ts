import { create } from 'zustand';
import { fetchAlertsApi, updateAlertStatusApi, AlertItem } from '../api/alertsApi';

export type AlertFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

export interface AlertState {
  alertsList: AlertItem[];
  loading: boolean;
  refreshing: boolean;
  searchQuery: string;
  statusFilter: AlertFilter;
  isStatusModalOpen: boolean;
  expandedCardIds: Record<string | number, boolean>;

  setSearchQuery: (query: string) => void;
  clearSearchQuery: () => void;
  setStatusFilter: (filter: AlertFilter) => void;
  setIsStatusModalOpen: (isOpen: boolean) => void;
  toggleExpandCard: (alertId: string | number) => void;
  resetExpandedCards: () => void;
  toggleAlertActive: (token: string | null, alertId: string | number) => Promise<void>;
  loadAlerts: (token: string | null, isRefresh?: boolean) => Promise<void>;
  onRefresh: (token: string | null) => Promise<void>;
}

export const useAlertStore = create<AlertState>((set, get) => ({
  alertsList: [],
  loading: false,
  refreshing: false,
  searchQuery: '',
  statusFilter: 'ALL',
  isStatusModalOpen: false,
  expandedCardIds: {},

  setSearchQuery: (query) => set({ searchQuery: query }),
  clearSearchQuery: () => set({ searchQuery: '' }),
  setStatusFilter: (filter) => set({ statusFilter: filter }),
  setIsStatusModalOpen: (isOpen) => set({ isStatusModalOpen: isOpen }),

  toggleExpandCard: (alertId) => {
    set((state) => ({
      expandedCardIds: {
        ...state.expandedCardIds,
        [alertId]: !state.expandedCardIds[alertId],
      },
    }));
  },

  resetExpandedCards: () => {
    set({ expandedCardIds: {} });
  },

  // Toggle active status in local state & call API
  toggleAlertActive: async (token, alertId) => {
    const { alertsList } = get();
    const alert = alertsList.find((a) => a.id === alertId);
    if (!alert) return;

    const newActive = alert.active === 1 ? 0 : 1;

    // Optimistic UI update
    set({
      alertsList: alertsList.map((item) =>
        item.id === alertId ? { ...item, active: newActive } : item
      ),
    });

    // Sync with backend API
    await updateAlertStatusApi(token, alertId, newActive);
  },

  // Load Alerts from API
  loadAlerts: async (token, isRefresh = false) => {
    try {
      if (!isRefresh) set({ loading: true });
      const data = await fetchAlertsApi(token);
      set({ alertsList: Array.isArray(data) ? data : [] });
    } catch (err: any) {
      console.warn('useAlertStore loadAlerts error:', err.message);
    } finally {
      set({ loading: false, refreshing: false });
    }
  },

  // Pull to refresh
  onRefresh: async (token) => {
    set({ refreshing: true });
    await get().loadAlerts(token, true);
  },
}));
