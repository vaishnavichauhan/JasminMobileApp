import { API_ENDPOINTS } from './config';
import { fetchWithAuth } from './apiClient';

export interface ReconciliationItem {
  reconciliation_id: string;
  match_status: 'MATCHED' | 'PARTIALLY_MATCHED' | 'INVOICE_NOT_SCRATCHED' | 'WINNING_NO_INVOICE';
  match_status_label: string;
  match_status_color: string;
  is_fully_matched: boolean;
  is_partially_matched: boolean;
  inv_no_matched: boolean;
  phone_match: boolean | null;
  time_diff_minutes: number | null;
  time_diff_human: string;

  // Invoice Details (ERP)
  invoice_number: string | null;
  invoice_date: string | null;
  invoice_time: string | null;
  invoice_datetime: string | null;
  invoice_branch_code: string | null;
  invoice_branch_name: string | null;
  invoice_customer_name: string | null;
  invoice_customer_phone: string | null;
  invoice_value: number | null;
  invoice_items: string | null;
  salesperson_name: string | null;

  // Contest Winning Details
  contest_id: number | null;
  contest_external_id: string | null;
  contest_invoice_number: string | null;
  contest_customer_name: string | null;
  contest_customer_phone: string | null;
  contest_birthdate: string | null;
  contest_branch_code: string | null;
  contest_branch_name: string | null;
  contest_prize: string | null;
  contest_status: string | null;
  contest_campaign: string | null;
  contest_scratch_time: string | null;

  // UI Sort/Index Helpers
  _sr?: number;
  sr_no?: number;
}

export interface ReconciliationSummary {
  totalInvoices: number;
  totalWinnings: number;
  matchedCount: number;
  fullyMatchedCount: number;
  partiallyMatchedCount: number;
  invoiceNotScratchedCount: number;
  winningNoInvoiceCount: number;
  totalAllReconciled: number;
  matchRatePercent: number;
  avgTimeDiffMinutes: number;
  avgTimeDiffHuman: string;
}

export interface LastSyncLog {
  id?: number;
  syncedBy?: string;
  deviceId?: string;
  recordsFetched?: number;
  recordsInserted?: number;
  recordsUpdated?: number;
  syncStatus?: string;
  errorMessage?: string | null;
  created_at?: string;
}

export interface ScratchWinReconciliationResponse {
  success: boolean;
  data: ReconciliationItem[];
  summary: ReconciliationSummary;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  filters?: {
    startDate: string;
    endDate: string;
    branchCode?: string;
    statusFilter?: string;
  };
  lastSync?: LastSyncLog | null;
  lastInvoiceSync?: string | null;
  message?: string;
}

export interface FetchReconciliationParams {
  startDate?: string;
  endDate?: string;
  branchCodes?: string;
  statusFilter?: string; // 'ALL' | 'MATCHED' | 'PARTIALLY_MATCHED' | 'INVOICE_NOT_SCRATCHED' | 'WINNING_NO_INVOICE'
  search?: string;
  page?: number;
  limit?: number;
  exportAll?: boolean;
  forceSync?: boolean;
}

export interface BranchOption {
  code: string;
  name: string;
  city?: string;
  state?: string;
}

/**
 * Fetch Scratch & Win Reconciliation Data
 */
export const fetchScratchWinReconciliationApi = async (
  params: FetchReconciliationParams = {}
): Promise<ScratchWinReconciliationResponse> => {
  const queryParts: string[] = [];

  // Default exportAll to true for client-side search, filtering and rapid pagination
  queryParts.push(`exportAll=${params.exportAll !== false ? 'true' : 'false'}`);

  if (params.forceSync) {
    queryParts.push('forceSync=true');
  }

  if (params.startDate) {
    queryParts.push(`startDate=${encodeURIComponent(params.startDate)}`);
  }
  if (params.endDate) {
    queryParts.push(`endDate=${encodeURIComponent(params.endDate)}`);
  }
  if (params.branchCodes && params.branchCodes.trim()) {
    const cleanBranches = params.branchCodes.trim();
    queryParts.push(`branchCodes=${encodeURIComponent(cleanBranches)}`);
    queryParts.push(`branchCode=${encodeURIComponent(cleanBranches)}`);
  }
  if (params.statusFilter && params.statusFilter !== 'ALL') {
    queryParts.push(`statusFilter=${encodeURIComponent(params.statusFilter)}`);
  }
  if (params.search && params.search.trim()) {
    queryParts.push(`search=${encodeURIComponent(params.search.trim())}`);
  }
  if (params.page) {
    queryParts.push(`page=${params.page}`);
  }
  if (params.limit) {
    queryParts.push(`limit=${params.limit}`);
  }

  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  const url = `${API_ENDPOINTS.REPORTS.SCRATCH_WIN_RECONCILIATION}${queryString}`;

  const response = await fetchWithAuth(url, {
    method: 'GET',
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    const errorMessage =
      errorJson.message ||
      errorJson.error ||
      (response.status === 403
        ? 'Access Denied. Insufficient permissions for scratch_win_reconciliation (read)'
        : `Failed to fetch reconciliation report: ${response.status}`);
    const err: any = new Error(errorMessage);
    err.status = response.status;
    err.statusCode = response.status;
    throw err;
  }

  const json = await response.json();
  return json;
};

/**
 * Trigger Contest Winnings Sync from external API
 */
export const syncContestWinningsApi = async (): Promise<{
  success: boolean;
  message: string;
  totalFetched?: number;
  lastSync?: LastSyncLog;
}> => {
  const response = await fetchWithAuth(API_ENDPOINTS.REPORTS.CONTEST_WINNINGS_SYNC, {
    method: 'POST',
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    const errorMessage =
      errorJson.message ||
      errorJson.error ||
      (response.status === 403
        ? 'Access Denied. Insufficient permissions to sync contest winnings (write)'
        : `Sync failed: ${response.status}`);
    const err: any = new Error(errorMessage);
    err.status = response.status;
    err.statusCode = response.status;
    throw err;
  }

  return await response.json();
};

/**
 * Fetch Last Sync Log Details
 */
export const fetchLastSyncDetailsApi = async (): Promise<LastSyncLog | null> => {
  try {
    const response = await fetchWithAuth(API_ENDPOINTS.REPORTS.CONTEST_WINNINGS_LAST_SYNC, {
      method: 'GET',
    });

    if (!response.ok) return null;
    const json = await response.json();
    return json.lastSync || json.data || null;
  } catch {
    return null;
  }
};

/**
 * Fetch Branches list for multi-select dropdown filter
 */
export const fetchBranchesListApi = async (): Promise<BranchOption[]> => {
  try {
    const response = await fetchWithAuth(API_ENDPOINTS.REPORTS.BRANCHES_ALL, {
      method: 'GET',
    });

    if (!response.ok) return [];

    const json = await response.json();
    const list = Array.isArray(json)
      ? json
      : Array.isArray(json?.data)
      ? json.data
      : Array.isArray(json?.branches)
      ? json.branches
      : [];

    return list.map((b: any) => ({
      code: String(b.code || b.branch_code || b.BranchCode || '').trim().toUpperCase(),
      name: String(b.name || b.branch_name || b.BranchName || b.code || '').trim(),
      city: String(b.city || b.city_name || '').trim(),
      state: String(b.state || b.state_name || '').trim(),
    })).filter((b: BranchOption) => Boolean(b.code));
  } catch (err) {
    console.warn('[scratchReconciliationApi] Failed to load branches:', err);
    return [];
  }
};
