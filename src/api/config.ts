import { Platform } from 'react-native';

// In iOS Simulator localhost is localhost, in Android Emulator it is 10.0.2.2
export const BASE_URL = Platform.select({
  android: 'http://10.0.2.2:5005/api',
  ios: 'http://localhost:5005/api',
  default: 'http://localhost:5005/api',
});
