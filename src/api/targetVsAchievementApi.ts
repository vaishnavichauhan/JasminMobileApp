import { API_ENDPOINTS } from './config';
import { fetchWithAuth } from './apiClient';

export interface TvaItem {
  id?: number;
  branch_name?: string;
  branchName?: string;
  abm_name?: string;

  qty_tgt?: number | string;
  value_tgt?: number | string;

  ftd_qty_ach?: number | string;
  ftd_value_ach?: number | string;

  lmftd_qty_ach?: number | string;
  lmftd_value_ach?: number | string;

  mtd_qty_ach?: number | string;
  mtd_value_ach?: number | string;

  lmtd_qty_ach?: number | string;
  lmtd_value_ach?: number | string;

  btd_qty?: number | string;
  btd_value?: number | string;

  ddr_qty?: number | string;
  ddr_value?: number | string;

  // Growth fields — correct API keys
  growth_qty_percentage?: number | string;
  growth_value_percentage?: number | string;

  // legacy aliases (kept for safety)
  growth_qty?: number | string;
  growth_value?: number | string;

  [key: string]: any;
}

export interface AbmWiseTvaItem {
  id?: number | string;
  abm_name?: string;
  abmName?: string;
  abm?: string;
  name?: string;
  state_name?: string;
  stateName?: string;
  branch_name?: string;

  qty_tgt?: number | string;
  value_tgt?: number | string;

  ftd_qty_ach?: number | string;
  ftd_value_ach?: number | string;

  lmftd_qty_ach?: number | string;
  lmftd_value_ach?: number | string;

  mtd_qty_ach?: number | string;
  mtd_value_ach?: number | string;

  mtd_qty_percentage_ach?: number | string;
  mtd_qty_pct_ach?: number | string;
  mtd_qty_ach_pct?: number | string;
  mtd_qty_percentage?: number | string;
  mtd_qty_pct?: number | string;

  mtd_value_percentage_ach?: number | string;
  mtd_value_pct_ach?: number | string;
  mtd_value_ach_pct?: number | string;
  mtd_value_percentage?: number | string;
  mtd_value_pct?: number | string;

  lmtd_qty_ach?: number | string;
  lmtd_value_ach?: number | string;

  btd_qty?: number | string;
  btd_value?: number | string;

  ddr_qty?: number | string;
  ddr_value?: number | string;

  growth_qty_percentage?: number | string;
  growth_value_percentage?: number | string;
  growth_qty?: number | string;
  growth_value?: number | string;

  [key: string]: any;
}



export const fetchTvaData = async (token?: string | null): Promise<TvaItem[]> => {
  const url = API_ENDPOINTS.REPORTS.TARGET_VS_ACHIEVEMENT_ALL;
  console.log('[TvA API] Request URL:', url);

  const response = await fetchWithAuth(url, {
    method: 'GET',
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    const err: any = new Error(
      errorJson.message || errorJson.error || `Failed to fetch target vs achievement: ${response.status}`
    );
    err.status = response.status;
    throw err;
  }

  const json = await response.json();

  console.log('[TvA API] Response json:', json);
  
  // Handle various response shapes
  if (Array.isArray(json)) return json;
  if (json?.data && Array.isArray(json.data)) return json.data;
  if (json?.results && Array.isArray(json.results)) return json.results;
  return [];
};

export const fetchAbmWiseTvaData = async (
  token?: string | null,
  stateName?: string | string[]
): Promise<AbmWiseTvaItem[]> => {
  let query = '';
  if (stateName && stateName !== 'All States') {
    const trimmed = typeof stateName === 'string' ? stateName.trim() : String(stateName).trim();
    if (trimmed.length > 0) {
      query = `?state=${encodeURIComponent(trimmed)}&state_name=${encodeURIComponent(trimmed)}`;
    }
  }

  const url = `${API_ENDPOINTS.REPORTS.TARGET_VS_ACHIEVEMENT_ABM_WISE}${query}`;
  console.log('[ABM TvA API] Request URL:', url);

  const response = await fetchWithAuth(url, {
    method: 'GET',
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    const err: any = new Error(
      errorJson.message || errorJson.error || `Failed to fetch ABM wise summary: ${response.status}`
    );
    err.status = response.status;
    throw err;
  }

  const json = await response.json();

  if (Array.isArray(json)) return json;
  if (json?.data && Array.isArray(json.data)) return json.data;
  if (json?.results && Array.isArray(json.results)) return json.results;
  return [];
};

export const fetchStatesApi = async (token?: string | null): Promise<string[]> => {
  try {
    const response = await fetchWithAuth(API_ENDPOINTS.REPORTS.TARGET_VS_ACHIEVEMENT_STATES, {
      method: 'GET',
    });

    if (!response.ok) {
      console.warn('[States API] Response not OK:', response.status);
      return [];
    }

    const json = await response.json();
    console.log('[States API] Response json:', json);

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
