import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logoutApi } from '../api/authApi';
import { STORAGE_KEYS, saveTokens, clearAllAuthData } from '../api/tokenStorage';
import { setUnauthorizedLogoutHandler } from '../api/apiClient';

interface AuthContextType {
  user: any;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  justLoggedIn: boolean;
  clearJustLoggedIn: () => void;
  login: (userData: any, token?: string, refreshToken?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  refreshToken: null,
  isLoading: true,
  isLoggedIn: false,
  justLoggedIn: false,
  clearJustLoggedIn: () => {},
  login: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [justLoggedIn, setJustLoggedIn] = useState(false);

  const logoutRef = useRef<(() => Promise<void>) | undefined>(undefined);

  // Logout handler: clears AsyncStorage, resets state & calls API
  const logout = useCallback(async () => {
    const currentToken = token;
    // 1. Instantly reset auth state so UI transitions immediately to LoginScreen
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    setJustLoggedIn(false);

    // 2. Clear all credentials from AsyncStorage
    try {
      await clearAllAuthData();
    } catch (storageErr) {
      console.warn('[AuthContext] Error clearing storage on logout:', storageErr);
    }

    // 3. Best-effort server-side logout
    try {
      if (currentToken) {
        await logoutApi(currentToken);
      } else {
        await logoutApi();
      }
    } catch (error) {
      console.warn('Error during logout API call:', error);
    }
  }, [token]);

  logoutRef.current = logout;

  // Load stored session ONCE on app startup
  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
        const storedToken = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        const storedRefresh = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
        if (storedToken) {
          setToken(storedToken);
        }
        if (storedRefresh) {
          setRefreshToken(storedRefresh);
        }
      } catch (error) {
        console.warn('Error loading auth data from storage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStorageData();

    // Register auto-logout when user is inactive, deactivated, or session expires
    setUnauthorizedLogoutHandler((reason?: string) => {
      console.warn('[AuthContext] Session expired or user inactive. Auto-logging out...', reason);
      logoutRef.current?.();
      if (reason) {
        Alert.alert(
          'Session Expired',
          reason,
          [{ text: 'OK', style: 'default' }],
          { cancelable: true }
        );
      }
    });
  }, []); // Run ONLY once on mount

  // Login handler: saves user, access token & refresh token to AsyncStorage & updates state
  const login = async (userData: any, authToken?: string, authRefreshToken?: string) => {
    try {
      setUser(userData);
      if (authToken) {
        setToken(authToken);
      }
      if (authRefreshToken) {
        setRefreshToken(authRefreshToken);
      }
      setJustLoggedIn(true);

      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
      if (authToken) {
        await saveTokens(authToken, authRefreshToken);
      }
    } catch (error) {
      console.warn('Error saving auth data to storage:', error);
    }
  };

  const clearJustLoggedIn = () => setJustLoggedIn(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        refreshToken,
        isLoading,
        isLoggedIn: !!user,
        justLoggedIn,
        clearJustLoggedIn,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
