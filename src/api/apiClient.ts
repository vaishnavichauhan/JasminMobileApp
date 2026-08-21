import { getAccessToken } from './tokenStorage';
import { refreshAccessTokenApi } from './authApi';

let isRefreshing = false;
let refreshSubscribers: ((token: string | null) => void)[] = [];

// Allow AuthContext or global app to register an unauthorized logout listener (when user is inactive or refresh token expires)
let onUnauthorizedLogout: ((reason?: string) => void) | null = null;

export const setUnauthorizedLogoutHandler = (handler: (reason?: string) => void) => {
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
 * Universal authenticated fetch with automatic Refresh Token rotation on 401/403.
 * If user is deactivated/inactive or session expires on ANY page, triggers automatic logout.
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

  // If 401 Unauthorized or 403 Forbidden (Access token expired, inactive user, or invalid session)
  if (response.status === 401 || response.status === 403) {
    let serverMessage = '';
    try {
      const cloned = response.clone();
      const body = await cloned.json();
      serverMessage = body.message || body.error || '';
    } catch {
      // ignore
    }

    const isDeactivatedOrInactive =
      serverMessage.toLowerCase().includes('deactivat') ||
      serverMessage.toLowerCase().includes('inactive') ||
      serverMessage.toLowerCase().includes('disabled') ||
      serverMessage.toLowerCase().includes('blocked') ||
      serverMessage.toLowerCase().includes('timed out');

    // If user is inactive/deactivated on ANY page, immediately trigger auto-logout
    if (isDeactivatedOrInactive) {
      console.warn(`[Auth] 🚫 Inactive user on ${url} (${serverMessage}). Logging out immediately.`);
      if (onUnauthorizedLogout) {
        onUnauthorizedLogout(serverMessage || 'Your account is deactivated. Please contact support.');
      }
      return response;
    }

    // Otherwise attempt token refresh
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await refreshAccessTokenApi();
      isRefreshing = false;

      if (newToken) {
        onRefreshed(newToken);
        headers.Authorization = `Bearer ${newToken}`;
        headers['x-access-token'] = newToken;
        return fetch(url, { ...options, headers });
      } else {
        console.warn(`[Auth] ❌ Session expired or user deactivated on ${url}. Auto-logging out to Login screen...`);
        onRefreshed(null);
        if (onUnauthorizedLogout) {
          onUnauthorizedLogout(serverMessage || 'Session timed out. Please login again.');
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
