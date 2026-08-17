import { Platform } from 'react-native';
import { BASE_URL } from './config';

export interface AlertItem {
  id: string | number;
  image_url: string;
  title: string;
  description: string;
  active: number; // 1 = active / toggle true, 0 = inactive / toggle false
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export const getHostUrl = (): string => {
  return 'https://interlink.jasminmobile.com';
};

export const normalizeImageUrl = (url: any): string => {
  if (!url || typeof url !== 'string') return '';
  let trimmed = url.trim();
  if (trimmed.length === 0) return '';

  // Data URI
  if (trimmed.startsWith('data:image')) {
    return trimmed;
  }

  const hostUrl = getHostUrl();

  // If already absolute URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    // If Android emulator and localhost, swap to 10.0.2.2
    if (
      Platform.OS === 'android' &&
      (trimmed.includes('localhost:5005') || trimmed.includes('127.0.0.1:5005'))
    ) {
      trimmed = trimmed
        .replace('localhost:5005', '10.0.2.2:5005')
        .replace('127.0.0.1:5005', '10.0.2.2:5005');
    }
    return trimmed;
  }

  // If relative path
  if (trimmed.startsWith('/')) {
    return `${hostUrl}${trimmed}`;
  }

  return `${hostUrl}/${trimmed}`;
};

const getVal = (obj: any, ...keys: string[]): any => {
  if (!obj || typeof obj !== 'object') return undefined;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') {
      return obj[k];
    }
  }
  return undefined;
};

const extractArray = (obj: any): any[] => {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  if (Array.isArray(obj.data)) return obj.data;
  if (Array.isArray(obj.alerts)) return obj.alerts;
  if (Array.isArray(obj.result)) return obj.result;
  if (Array.isArray(obj.data?.alerts)) return obj.data.alerts;
  return [];
};

/**
 * Fetch Alerts API
 * GET http://localhost:5005/api/alerts
 */
export const fetchAlertsApi = async (token?: string | null): Promise<AlertItem[]> => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
      headers['x-access-token'] = token;
    }

    const response = await fetch(`${BASE_URL}/alerts`, {
      method: 'GET',
      headers,
    });

    const text = await response.text();
    let json: any = {};
    if (text && text.trim().length > 0) {
      try {
        json = JSON.parse(text);
      } catch {
        json = { data: [] };
      }
    }

    if (!response.ok) {
      throw new Error(json.message || json.error || `Server error: ${response.status}`);
    }

    const rawList = extractArray(json);

    return rawList.map((item: any, index: number) => {
      const id = item.id || item._id || item.alert_id || index + 1;
      const title =
        getVal(item, 'title', 'alert_title', 'name', 'heading') ||
        `Alert #${index + 1}`;

      const description =
        getVal(item, 'description', 'desc', 'details', 'message', 'body') || '';

      const rawImage =
        getVal(
          item,
          'image_url',
          'imageUrl',
          'image',
          'img',
          'banner_url',
          'banner',
          'photo',
          'photo_url',
          'file_url',
          'alert_image',
          'alertImage',
          'icon',
          'image_path',
          'imagePath',
          'path',
          'file',
          'url',
          'attachment',
          'media'
        ) || '';

      const image_url = normalizeImageUrl(rawImage);

      // Normalize active: 1 for active/true, 0 for inactive/false
      const rawActive = getVal(item, 'active', 'is_active', 'status', 'enabled');
      let activeNum = 1;
      if (
        rawActive === 0 ||
        rawActive === '0' ||
        rawActive === false ||
        rawActive === 'inactive' ||
        rawActive === 'disabled'
      ) {
        activeNum = 0;
      } else if (
        rawActive === 1 ||
        rawActive === '1' ||
        rawActive === true ||
        rawActive === 'active' ||
        rawActive === 'enabled'
      ) {
        activeNum = 1;
      }

      return {
        id,
        title,
        description,
        image_url,
        active: activeNum,
        created_at: getVal(item, 'created_at', 'createdAt', 'date'),
        updated_at: getVal(item, 'updated_at', 'updatedAt'),
        rawItem: item,
      };
    });
  } catch (error: any) {
    console.warn('fetchAlertsApi error:', error.message || error);
    return [];
  }
};

/**
 * Optional API to update Alert active status
 */
export const updateAlertStatusApi = async (
  token: string | null | undefined,
  alertId: string | number,
  active: number
): Promise<boolean> => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
      headers['x-access-token'] = token;
    }

    const response = await fetch(`${BASE_URL}/alerts/${alertId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ active }),
    });

    return response.ok;
  } catch (error: any) {
    console.warn('updateAlertStatusApi error:', error.message || error);
    return false;
  }
};
