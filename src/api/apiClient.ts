import { getAccessToken } from './tokenStorage';
import { refreshAccessTokenApi } from './authApi';

let isRefreshing = false;
let refreshSubscribers: ((token: string | null) => void)[] = [];

// Allow AuthContext or global app to register an unauthorized logout listener (when 7-day refresh token expires)
let onUnauthorizedLogout: (() => void) | null = null;

export const setUnauthorizedLogoutHandler = (handler: () => void) => {
  onUnauthorizedLogout = handler;
};

const subscribeTokenRefresh = (cb: (token: string | null) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token: string | null) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

/**
 * Universal authenticated fetch with automatic Refresh Token rotation on 401 Unauthorized.
 * If token is expired (15m), refreshes seamlessly and retries the original request.
 * If refresh token is expired (7d), triggers automatic logout to return user to Login screen.
 */
export const fetchWithAuth = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  let token = await getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
    headers['x-access-token'] = token;
  }

  let response = await fetch(url, { ...options, headers });

  // If 401 Unauthorized or 403 Forbidden (Access token expired/invalid), attempt auto-refresh
  if (response.status === 401 || response.status === 403) {
    console.log(`[Auth] ⚠️ Got ${response.status} from ${url}. Attempting token refresh...`);
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await refreshAccessTokenApi();
      isRefreshing = false;

      if (newToken) {
        console.log('[Auth] 🔄 Token refresh succeeded! Retrying original request with new token.');
        onRefreshed(newToken);
        headers.Authorization = `Bearer ${newToken}`;
        headers['x-access-token'] = newToken;
        return fetch(url, { ...options, headers });
      } else {
        console.warn('[Auth] ❌ Refresh token has expired or is invalid. Logging out to Login screen...');
        onRefreshed(null);
        if (onUnauthorizedLogout) {
          onUnauthorizedLogout();
        }
      }
    } else {
      // If another request is currently refreshing the token, wait for its completion
      return new Promise<Response>((resolve, reject) => {
        subscribeTokenRefresh(async (newToken) => {
          if (newToken) {
            headers.Authorization = `Bearer ${newToken}`;
            headers['x-access-token'] = newToken;
            try {
              const retryResponse = await fetch(url, { ...options, headers });
              resolve(retryResponse);
            } catch (err) {
              reject(err);
            }
          } else {
            resolve(response);
          }
        });
      });
    }
  }

  return response;
};
