import { BASE_URL } from './config';

export interface LoginPayload {
  username: string;
  password: string;
  deviceId?: string;
}

export interface LoginResponse {
  success?: boolean;
  token?: string;
  user?: any;
  message?: string;
  error?: string;
  msg?: string;
  [key: string]: any;
}

/**
 * Login API Request
 * POST http://localhost:5000/api/auth/login
 */
export const loginApi = async (payload: LoginPayload): Promise<LoginResponse> => {
  try {
    const requestBody = {
      username: payload.username.trim(),
      password: payload.password,
      deviceId: payload.deviceId !== undefined ? payload.deviceId : '',
    };

    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const text = await response.text();
    let data: any = {};

    if (text && text.trim().length > 0) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }
    }

    if (!response.ok) {
      const serverMessage =
        data.message ||
        data.error ||
        data.msg ||
        data.err ||
        data.detail ||
        (text && text.length < 150 ? text : null);

      const errorMessage =
        serverMessage ||
        (response.status === 403
          ? '403 Forbidden: Invalid username/password or unauthorized access.'
          : `Server returned status ${response.status}`);

      throw new Error(errorMessage);
    }

    return data;
  } catch (error: any) {
    if (error.message === 'Network request failed') {
      throw new Error(
        'Cannot connect to server. Please ensure your backend is running.'
      );
    }
    throw error;
  }
};

/**
 * Logout API Request
 * POST http://localhost:5000/api/auth/logout
 */
export const logoutApi = async (token?: string): Promise<any> => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
console.log("token",token);

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers,
    });

    const text = await response.text();
    let data: any = {};

    if (text && text.trim().length > 0) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }
    }

    return data;
  } catch (error: any) {
    console.warn('Logout API error:', error);
    return { success: false, message: error.message };
  }
};
