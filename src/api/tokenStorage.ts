import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  USER_DATA: '@jasmin_user_data',
  AUTH_TOKEN: '@jasmin_auth_token',
  REFRESH_TOKEN: '@jasmin_refresh_token',
};

export const getAccessToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch {
    return null;
  }
};

export const getRefreshToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  } catch {
    return null;
  }
};

export const saveTokens = async (accessToken: string, refreshToken?: string) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, accessToken);
    if (refreshToken) {
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    }
  } catch (error) {
    console.warn('[TokenStorage] Error saving tokens:', error);
  }
};

export const clearAllAuthData = async () => {
  try {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA),
      AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN),
      AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
    ]);
  } catch (error) {
    console.warn('[TokenStorage] Error clearing auth data:', error);
  }
};

