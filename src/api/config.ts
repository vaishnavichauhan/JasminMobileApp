import { Platform } from 'react-native';

const PORT = 5005;

// Android Emulator maps host machine's localhost to 10.0.2.2
const LOCAL_DEV_URL =
  Platform.OS === 'android'
    ? `http://10.0.2.2:${PORT}/v1/api`
    : `http://localhost:${PORT}/v1/api`;

// export const BASE_URL = 'https://interlink.jasminmobile.com/v1/api';
export const BASE_URL = LOCAL_DEV_URL;

export const getHostUrl = (): string => {
  return BASE_URL.replace(/\/api\/?$/, '');
};

/**
 * Centralized Common API URLs and Endpoints Map
 */
export const API_ENDPOINTS = {
  // Auth Endpoints
  AUTH: {
    LOGIN: `${BASE_URL}/auth/login`,
    REQUEST_DEVICE: `${BASE_URL}/auth/request-device`,
    LOGOUT: `${BASE_URL}/auth/logout`,
    REFRESH: `${BASE_URL}/auth/refresh`,
  },

  // Dashboard Endpoints
  DASHBOARD: {
    STOCK_CASH_DEPOSIT_ABM_WISE: `${BASE_URL}/stock-cash-deposit/abm-wise`,
    BRAND_WISE_SALES_DATA: `${BASE_URL}/brand-wise-sales/data`,
    BRAND_WISE_SALES_TOTALS: `${BASE_URL}/brand-wise-sales/totals`,
    STATES_ALL: `${BASE_URL}/states/all`,
  },

  // Reports Endpoints
  REPORTS: {
    STOCK_CASH_DEPOSIT_ALL: `${BASE_URL}/stock-cash-deposit/all`,
    STOCK_CASH_DEPOSIT_STATES: `${BASE_URL}/stock-cash-deposit/states`,
    FINANCE_BRAND: `${BASE_URL}/reports/finance-brand-report`,
    VARIATIONS_ALL: `${BASE_URL}/variations/all`,
    PRICE_LIST_REPORT: (variationId: string | number) =>
      `${BASE_URL}/price-lists/report/${variationId}`,
    PRICE_LIST_STOCK_INFO: `${BASE_URL}/price-lists/stock-info`,
    TARGET_VS_ACHIEVEMENT_ALL: `${BASE_URL}/target-vs-achievement/all`,
    TARGET_VS_ACHIEVEMENT_ABM_WISE: `${BASE_URL}/target-vs-achievement/abm-wise-summary`,
    TARGET_VS_ACHIEVEMENT_STATES: `${BASE_URL}/target-vs-achievement/states`,
  },

  // Offers Endpoints
  OFFERS: {
    ALL: `${BASE_URL}/offers/all`,
  },

  // Alerts Endpoints
  ALERTS: {
    BASE: `${BASE_URL}/alerts`,
    BY_ID: (alertId: string | number) => `${BASE_URL}/alerts/${alertId}`,
  },
};

export const API_URLS = API_ENDPOINTS;

export default API_ENDPOINTS;