import { BASE_URL } from './config';

export interface StockCashDepositItem {
  id?: number | string;
  branch_name?: string;
  branchName?: string;
  branch?: string;

  state_name?: string;
  stateName?: string;
  state?: string;

  city_name?: string;
  cityName?: string;
  city?: string;

  abm_name?: string;
  abmName?: string;
  abm?: string;

  store_type?: string;
  storeType?: string;

  status?: string | number;
  store_status?: string;

  stock_deposit?: number | string;
  stockDeposit?: number | string;

  support_20?: number | string;
  support_20_percent?: number | string;
  support_twenty?: number | string;
  support?: number | string;

  paid_support?: number | string;
  paidSupport?: number | string;

  total_stock_invest?: number | string;
  totalStockInvest?: number | string;

  current_stock?: number | string;
  currentStock?: number | string;

  // Today Date section fields
  opening_cash_deposit_pending?: number | string;
  opening_cash_pending?: number | string;
  openingCashDepositPending?: number | string;
  opening_cash?: number | string;

  cash_deposit?: number | string;
  cashDeposit?: number | string;

  pending_cash_deposit?: number | string;
  pendingCashDeposit?: number | string;

  credit_debit?: number | string;
  creditDebit?: number | string;

  available_limit_with_cash_deposit?: number | string;
  availableLimitWithCashDeposit?: number | string;
  available_limit?: number | string;

  [key: string]: any;
}

export const fetchStockCashDepositAllApi = async (
  token?: string | null,
  stateName?: string
): Promise<StockCashDepositItem[]> => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
      headers['x-access-token'] = token;
    }

    let query = '';
    if (stateName && stateName.trim() && stateName !== 'All States') {
      query = `?state_name=${encodeURIComponent(stateName.trim())}`;
    }

    const response = await fetch(`${BASE_URL}/stock-cash-deposit/all${query}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      console.warn('[Stock Cash Deposit API] Response not OK:', response.status);
      return [];
    }

    const json = await response.json();

    if (Array.isArray(json)) return json;
    if (json?.data && Array.isArray(json.data)) return json.data;
    if (json?.results && Array.isArray(json.results)) return json.results;
    return [];
  } catch (error) {
    console.warn('[Stock Cash Deposit API] Fetch error:', error);
    return [];
  }
};

export const fetchStatesApi = async (token?: string | null): Promise<string[]> => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
      headers['x-access-token'] = token;
    }

    const response = await fetch(`${BASE_URL}/states/all`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      console.warn('[States API] Response not OK:', response.status);
      return [];
    }

    const json = await response.json();
    const list = Array.isArray(json)
      ? json
      : Array.isArray(json?.data)
      ? json.data
      : Array.isArray(json?.results)
      ? json.results
      : Array.isArray(json?.states)
      ? json.states
      : [];

    const stateSet = new Set<string>();
    list.forEach((item: any) => {
      let st = '';
      if (typeof item === 'string') {
        st = item;
      } else if (item && typeof item === 'object') {
        st =
          item.state_name ||
          item.stateName ||
          item.STATE_NAME ||
          item.state ||
          item.State ||
          item.name ||
          item.title ||
          '';
      }
      if (st && st.trim().length > 0 && st !== '—') {
        stateSet.add(st.trim());
      }
    });

    return Array.from(stateSet).sort((a, b) => a.localeCompare(b));
  } catch (error) {
    console.warn('[States API] Fetch error:', error);
    return [];
  }
};
