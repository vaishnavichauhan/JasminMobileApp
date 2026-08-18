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

    const isDeviceRegistrationRequired =
      data.status === 'DEVICE_REGISTRATION_REQUIRED' ||
      data.data?.status === 'DEVICE_REGISTRATION_REQUIRED' ||
      data.status === 'device_registration_required' ||
      data.data?.status === 'device_registration_required';

    if (isDeviceRegistrationRequired) {
      return data;
    }

    const isExplicitFailure =
      data.success === false ||
      data.success === 'false' ||
      data.success === 'False' ||
      data.success === 0 ||
      data.status === 'error' ||
      data.status === false ||
      data.status === 'false';

    if (!response.ok || isExplicitFailure) {
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
          : `Invalid username or password`);

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

export interface ApprovedDeviceItem {
  id: number | string;
  device_id: string;
  submitted_at?: string;
  approved_at?: string;
  created_at?: string;
  [key: string]: any;
}

export interface RequestDevicePayload {
  username: string;
  password?: string;
  deviceId: string;
  revokeDeviceId?: number | string;
}

export interface RequestDeviceResponse {
  success?: boolean;
  message?: string;
  error?: string;
  msg?: string;
  approvedDevices?: ApprovedDeviceItem[];
  [key: string]: any;
}

/**
 * Request Device Approval API
 * POST http://localhost:5005/api/auth/request-device
 */
export const requestDeviceApi = async (
  payload: RequestDevicePayload
): Promise<RequestDeviceResponse> => {
  try {
    const requestBody: any = {
      username: payload.username.trim(),
      password: payload.password || '',
      deviceId: payload.deviceId.trim(),
    };

    if (
      payload.revokeDeviceId !== undefined &&
      payload.revokeDeviceId !== null &&
      payload.revokeDeviceId !== ''
    ) {
      requestBody.revokeDeviceId = payload.revokeDeviceId;
    }

    const response = await fetch(`${BASE_URL}/auth/request-device`, {
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

    const isExplicitFailure =
      data.success === false ||
      data.success === 'false' ||
      data.success === 'False' ||
      data.success === 0 ||
      data.status === 'error' ||
      data.status === false ||
      data.status === 'false';

    if (!response.ok || isExplicitFailure) {
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
          ? '403 Forbidden: Request device unauthorized.'
          : 'Failed to submit device registration request');

      const customError: any = new Error(errorMessage);
      customError.data = data;
      customError.status = data.status;
      customError.approvedDevices =
        data.approvedDevices || data.data?.approvedDevices || [];
      throw customError;
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
