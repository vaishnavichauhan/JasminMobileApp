import { Platform } from 'react-native';
import { BASE_URL } from './config';

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

const getTvaBaseUrl = (): string => {
  return Platform.OS === 'android'
    ? 'http://10.0.2.2:5005/api'
    : 'http://localhost:5005/api';
};

export const fetchTvaData = async (token?: string | null): Promise<TvaItem[]> => {
  try {
    const baseUrl = getTvaBaseUrl();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${baseUrl}/target-vs-achievement/all`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      console.warn('[TvA API] Response not OK:', response.status);
      return [];
    }

    const json = await response.json();

    // Handle various response shapes
    if (Array.isArray(json)) return json;
    if (json?.data && Array.isArray(json.data)) return json.data;
    if (json?.results && Array.isArray(json.results)) return json.results;
    return [];
  } catch (error) {
    console.warn('[TvA API] Fetch error:', error);
    return [];
  }
};

export const fetchAbmWiseTvaData = async (token?: string | null): Promise<AbmWiseTvaItem[]> => {
  try {
    const baseUrl = getTvaBaseUrl();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${baseUrl}/target-vs-achievement/abm-wise`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      console.warn('[ABM TvA API] Response not OK:', response.status);
      return [];
    }

    const json = await response.json();

    if (Array.isArray(json)) return json;
    if (json?.data && Array.isArray(json.data)) return json.data;
    if (json?.results && Array.isArray(json.results)) return json.results;
    return [];
  } catch (error) {
    console.warn('[ABM TvA API] Fetch error:', error);
    return [];
  }
};
