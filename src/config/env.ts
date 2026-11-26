import { Platform } from 'react-native';

/**
 * Backend base URL. In development the Android emulator reaches the Mac's
 * localhost at 10.0.2.2; the iOS simulator can use localhost directly.
 */
const DEV_API_URL = Platform.select({
  android: 'http://10.0.2.2:4000',
  default: 'http://localhost:4000',
});

const API_ORIGIN = __DEV__ ? DEV_API_URL : 'https://api.example.com'; // TODO: production URL

export const config = {
  apiBaseUrl: `${API_ORIGIN}/api/v1`,
  /** Public pages served by the backend. */
  legalUrls: {
    terms: `${API_ORIGIN}/legal/terms`,
    privacy: `${API_ORIGIN}/legal/privacy`,
  },
} as const;
