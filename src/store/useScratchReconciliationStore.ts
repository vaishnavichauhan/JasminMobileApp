import { create } from 'zustand';
import {
  fetchScratchWinReconciliationApi,
  syncContestWinningsApi,
  fetchBranchesListApi,
  ReconciliationItem,
  ReconciliationSummary,
  LastSyncLog,
  BranchOption,
} from '../api/scratchReconciliationApi';

const getTodayString = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const DEFAULT_START_DATE = '2026-10-05';

export interface ScratchReconciliationState {
  records: ReconciliationItem[];
  summary: ReconciliationSummary | null;
  lastSync: LastSyncLog | null;
  lastInvoiceSync: string | null;
  branches: BranchOption[];

  // Loading & Action states
  loading: boolean;
  refreshing: boolean;
  syncing: boolean;
  error: string | null;

  // Active filters
  startDate: string;
  endDate: string;
  selectedBranches: string[];
  activeTab: 'ALL' | 'MATCHED' | 'PARTIALLY_MATCHED' | 'INVOICE_NOT_SCRATCHED' | 'WINNING_NO_INVOICE';
  searchQuery: string;

  // Setters
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  setSelectedBranches: (branches: string[]) => void;
  toggleBranch: (code: string) => void;
  selectAllBranches: () => void;
  clearBranches: () => void;
  setActiveTab: (tab: 'ALL' | 'MATCHED' | 'PARTIALLY_MATCHED' | 'INVOICE_NOT_SCRATCHED' | 'WINNING_NO_INVOICE') => void;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;

  // Data fetch actions
  loadData: (isRefresh?: boolean, forceSync?: boolean) => Promise<void>;
  syncWinnings: () => Promise<{ success: boolean; message: string }>;
  loadBranches: () => Promise<void>;
}

let currentReconciliationRequestId = 0;

export const useScratchReconciliationStore = create<ScratchReconciliationState>(
  (set, get) => ({
    records: [],
    summary: null,
    lastSync: null,
    lastInvoiceSync: null,
    branches: [],

    loading: false,
    refreshing: false,
    syncing: false,
    error: null,

    startDate: DEFAULT_START_DATE,
    endDate: getTodayString(),
    selectedBranches: [],
    activeTab: 'ALL',
    searchQuery: '',

    setStartDate: (date) => {
      // Backend optimization rule: minimum date 2026-10-05
      const effective = !date || date < DEFAULT_START_DATE ? DEFAULT_START_DATE : date;
      set({ startDate: effective });
    },

    setEndDate: (date) => {
      set({ endDate: date || getTodayString() });
    },

    setSelectedBranches: (branches) => {
      const normalized = (branches || [])
        .map((b) => String(b).trim().toUpperCase())
        .filter(Boolean);
      set({ selectedBranches: normalized });
    },

    toggleBranch: (code) => {
      const current = get().selectedBranches;
      const upper = code.trim().toUpperCase();
      const updated = current.includes(upper)
        ? current.filter((c) => c !== upper)
        : [...current, upper];
      set({ selectedBranches: updated });
    },

    selectAllBranches: () => {
      const allCodes = get().branches.map((b) => b.code.trim().toUpperCase()).filter(Boolean);
      set({ selectedBranches: Array.from(new Set(allCodes)) });
    },

    clearBranches: () => set({ selectedBranches: [] }),

    setActiveTab: (tab) => set({ activeTab: tab }),

    setSearchQuery: (query) => set({ searchQuery: query }),

    resetFilters: () => {
      set({
        startDate: DEFAULT_START_DATE,
        endDate: getTodayString(),
        selectedBranches: [],
        activeTab: 'ALL',
        searchQuery: '',
      });
    },

    loadBranches: async () => {
      try {
        const branchList = await fetchBranchesListApi();
        if (Array.isArray(branchList) && branchList.length > 0) {
          const upperList = branchList.map((b) => ({
            ...b,
            code: b.code.trim().toUpperCase(),
          }));
          set({ branches: upperList });
        }
      } catch (err: any) {
        console.warn('[useScratchReconciliationStore] Failed to load branches:', err?.message || err);
      }
    },

    loadData: async (isRefresh = false, forceSync = false) => {
      const requestId = ++currentReconciliationRequestId;
      try {
        if (isRefresh) {
          set({ refreshing: true });
        } else {
          set({ loading: true });
        }
        set({ error: null });

        const { startDate, endDate, selectedBranches, searchQuery } = get();
        const branchParam = selectedBranches
          .map((c) => c.trim().toUpperCase())
          .filter(Boolean)
          .join(',');

        const res = await fetchScratchWinReconciliationApi({
          exportAll: true,
          startDate: startDate || DEFAULT_START_DATE,
          endDate: endDate || getTodayString(),
          branchCodes: branchParam,
          statusFilter: 'ALL',
          search: searchQuery,
          forceSync: forceSync || isRefresh,
        });

        // Ignore response if another request was triggered in the meantime
        if (requestId !== currentReconciliationRequestId) {
          return;
        }

        if (res?.success) {
          const rawRecords = res.data || [];
          const indexedRecords = rawRecords.map((item, idx) => ({
            ...item,
            _sr: idx + 1,
            sr_no: idx + 1,
          }));

          set({
            records: indexedRecords,
            summary: res.summary || null,
            lastSync: res.lastSync || null,
            lastInvoiceSync: res.lastInvoiceSync || null,
          });

          // Augment and merge participating branches from raw records with existing branches
          const branchMap = new Map<string, BranchOption>();
          get().branches.forEach((b) => {
            const c = b.code.trim().toUpperCase();
            if (c) branchMap.set(c, { ...b, code: c });
          });

          rawRecords.forEach((r) => {
            if (r.invoice_branch_code) {
              const c = String(r.invoice_branch_code).trim().toUpperCase();
              const n = String(r.invoice_branch_name || c).trim();
              if (c) {
                const existing = branchMap.get(c);
                branchMap.set(c, {
                  code: c,
                  name: existing?.name || n || c,
                  city: existing?.city || '',
                  state: existing?.state || '',
                });
              }
            }
            if (r.contest_branch_code) {
              const c = String(r.contest_branch_code).trim().toUpperCase();
              const n = String(r.contest_branch_name || c).trim();
              if (c) {
                const existing = branchMap.get(c);
                branchMap.set(c, {
                  code: c,
                  name: existing?.name || n || c,
                  city: existing?.city || '',
                  state: existing?.state || '',
                });
              }
            }
          });

          if (branchMap.size > 0) {
            const mergedList = Array.from(branchMap.values()).sort((a, b) =>
              a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
            );
            set({ branches: mergedList });
          }
        } else {
          set({ error: res?.message || 'Failed to fetch reconciliation report' });
        }
      } catch (err: any) {
        if (requestId === currentReconciliationRequestId) {
          const msg = err?.message || 'Error loading Scratch & Win Reconciliation report';
          set({ error: msg });
        }
      } finally {
        if (requestId === currentReconciliationRequestId) {
          set({ loading: false, refreshing: false });
        }
      }
    },

    syncWinnings: async () => {
      if (get().syncing) {
        return { success: false, message: 'Sync in progress' };
      }
      try {
        set({ syncing: true });
        const res = await syncContestWinningsApi();
        if (res?.success) {
          if (res.lastSync) {
            set({ lastSync: res.lastSync });
          }
          // Refresh reconciliation data after successful sync
          await get().loadData(false);
          return { success: true, message: res.message || 'Synced successfully!' };
        } else {
          return { success: false, message: res?.message || 'Sync failed' };
        }
      } catch (err: any) {
        return { success: false, message: err?.message || 'Failed to sync contest winnings' };
      } finally {
        set({ syncing: false });
      }
    },
  })
);
