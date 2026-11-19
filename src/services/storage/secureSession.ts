import * as Keychain from 'react-native-keychain';

/**
 * Only the refresh token and who it belongs to are kept on the device,
 * encrypted by the platform (iOS Keychain, Android Keystore AES-GCM).
 * Access tokens stay in memory. Never AsyncStorage.
 */
export type StoredSession = {
  refreshToken: string;
  user: { id: string; phone: string };
};

const SERVICE = 'com.allorders.session';
const OPTIONS = {
  service: SERVICE,
  accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
};

export async function saveSession(session: StoredSession) {
  await Keychain.setGenericPassword(
    session.user.id,
    JSON.stringify(session),
    OPTIONS,
  );
}

export async function loadSession(): Promise<StoredSession | null> {
  try {
    const found = await Keychain.getGenericPassword({ service: SERVICE });
    if (!found) return null;
    const parsed = JSON.parse(found.password) as StoredSession;
    return parsed.refreshToken && parsed.user?.id ? parsed : null;
  } catch {
    // Unreadable (e.g. keys reset after a device restore): start fresh.
    await clearSession();
    return null;
  }
}

export async function clearSession() {
  await Keychain.resetGenericPassword({ service: SERVICE });
}
