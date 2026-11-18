import { Platform } from 'react-native';

/**
 * Backend base URL. In development the Android emulator reaches the Mac's
 * localhost at 10.0.2.2; the iOS simulator can use localhost directly.
 */
const DEV_API_URL = Platform.select({
  android: 'http://10.0.2.2:4000',
  default: 'http://localhost:4000',
});

export const config = {
  apiBaseUrl: __DEV__ ? DEV_API_URL : 'https://api.example.com', // TODO: set production URL
} as const;
