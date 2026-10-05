import { Linking, Alert, Platform, ToastAndroid } from 'react-native';
import { BASE_URL } from './config';

/**
 * Hardcoded Current App Version (as instructed: do not touch gradle files)
 */
export const CURRENT_APP_VERSION = '01.05.10';

export const getAppVersion = (): string => {
  return CURRENT_APP_VERSION;
};

export interface AppUpdateResponse {
  success: boolean;
  currentVersion?: string;
  latestVersion?: string;
  updateRequired: boolean;
  message?: string;
  apkAvailable?: boolean;
  downloadUrl?: string;
  fileSize?: number;
  lastModified?: string;
}

/**
 * Helper to resolve absolute download URL based on backend BASE_URL
 */
export const getFullDownloadUrl = (downloadUrl?: string): string => {
  if (!downloadUrl) {
    return `${BASE_URL}/app/download`;
  }

  if (downloadUrl.startsWith('http://') || downloadUrl.startsWith('https://')) {
    return downloadUrl;
  }

  // Extract base origin (e.g. http://10.0.2.2:5005 or https://erp.jasminmobile.com)
  const baseOrigin = BASE_URL.replace(/\/v1\/api\/?$/, '').replace(/\/api\/?$/, '');
  const cleanPath = downloadUrl.startsWith('/') ? downloadUrl : `/${downloadUrl}`;
  return `${baseOrigin}${cleanPath}`;
};

/**
 * Check for application updates from the backend
 */
export const checkAppUpdateApi = async (
  version: string = CURRENT_APP_VERSION
): Promise<AppUpdateResponse> => {
  try {
    const url = `${BASE_URL}/app/check-update?version=${encodeURIComponent(version)}`;
    console.log('[checkAppUpdateApi] Calling update API:', url);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    const data: AppUpdateResponse = await response.json();
    console.log('[checkAppUpdateApi] Response:', data);

    // Verify if versions are different even if updateRequired is false
    const isDifferent =
      Boolean(data.latestVersion) &&
      data.latestVersion?.trim() !== '' &&
      data.latestVersion?.trim() !== version.trim();

    return {
      ...data,
      updateRequired: Boolean(data.updateRequired || isDifferent),
    };
  } catch (error: any) {
    console.warn('[checkAppUpdateApi] Error checking update:', error);
    throw error;
  }
};

/**
 * Trigger APK download in the device browser
 */
export const triggerApkDownload = async (
  downloadUrl?: string,
  apkAvailable: boolean = true,
  latestVersion?: string
) => {
  try {
    if (apkAvailable === false) {
      Alert.alert(
        'Update Unavailable',
        `The latest APK build (v${latestVersion || 'latest'}) is currently not available for download on the server. Please try again later or contact support.`
      );
      return;
    }

    const fullUrl = getFullDownloadUrl(downloadUrl);
    console.log(`[triggerApkDownload] Triggering download for v${latestVersion || 'latest'} from:`, fullUrl);

    if (Platform.OS === 'android') {
      ToastAndroid.show('Opening APK download...', ToastAndroid.SHORT);
    }

    const supported = await Linking.canOpenURL(fullUrl).catch(() => true);
    if (supported) {
      await Linking.openURL(fullUrl);
    } else {
      // Fallback attempt
      await Linking.openURL(fullUrl);
    }
  } catch (err: any) {
    console.warn('[triggerApkDownload] Open URL error:', err);
    Alert.alert(
      'Download Error',
      err?.message || 'Unable to open download URL in browser. Please check your internet connection.'
    );
  }
};
