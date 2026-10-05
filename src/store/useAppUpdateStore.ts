import { create } from 'zustand';
import {
  checkAppUpdateApi,
  AppUpdateResponse,
  CURRENT_APP_VERSION,
} from '../api/appUpdateApi';

export interface AppUpdateState {
  updateInfo: AppUpdateResponse | null;
  checkingUpdate: boolean;
  hasUpdateAvailable: boolean;
  checkForUpdates: () => Promise<AppUpdateResponse | null>;
}

export const useAppUpdateStore = create<AppUpdateState>((set) => ({
  updateInfo: null,
  checkingUpdate: false,
  hasUpdateAvailable: false,

  checkForUpdates: async () => {
    try {
      set({ checkingUpdate: true });
      const res = await checkAppUpdateApi(CURRENT_APP_VERSION);
      const isAvailable = Boolean(
        res?.updateRequired ||
        (res?.latestVersion && res.latestVersion.trim() !== CURRENT_APP_VERSION.trim())
      );
      set({
        updateInfo: res,
        hasUpdateAvailable: isAvailable,
        checkingUpdate: false,
      });
      return res;
    } catch {
      set({ checkingUpdate: false });
      return null;
    }
  },
}));
