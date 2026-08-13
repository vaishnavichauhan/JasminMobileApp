import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logoutApi } from '../api/authApi';

interface AuthContextType {
  user: any;
  token: string | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  justLoggedIn: boolean;
  clearJustLoggedIn: () => void;
  login: (userData: any, token?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const STORAGE_KEYS = {
  USER_DATA: '@jasmin_user_data',
  AUTH_TOKEN: '@jasmin_auth_token',
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
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
  const [isLoading, setIsLoading] = useState(true);
  const [justLoggedIn, setJustLoggedIn] = useState(false);

  // Load stored session on app startup
  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
        const storedToken = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
        if (storedToken) {
          setToken(storedToken);
        }
      } catch (error) {
        console.warn('Error loading auth data from storage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStorageData();
  }, []);

  // Login handler: saves user & token to AsyncStorage & updates state
  const login = async (userData: any, authToken?: string) => {
    try {
      setUser(userData);
      if (authToken) {
        setToken(authToken);
      }
      setJustLoggedIn(true);

      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
      if (authToken) {
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, authToken);
      }
    } catch (error) {
      console.warn('Error saving auth data to storage:', error);
    }
  };

  // Logout handler: calls API, clears AsyncStorage & resets state
  const logout = async () => {
    try {
      if (token) {
        await logoutApi(token);
      } else {
        await logoutApi();
      }
    } catch (error) {
      console.warn('Error during logout API call:', error);
    } finally {
      setUser(null);
      setToken(null);
      setJustLoggedIn(false);
      try {
        await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
        await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      } catch (storageError) {
        console.warn('Error removing items from storage:', storageError);
      }
    }
  };

  const clearJustLoggedIn = () => setJustLoggedIn(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
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
