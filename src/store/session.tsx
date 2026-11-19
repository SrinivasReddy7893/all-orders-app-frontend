import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { ApiError } from '@/services/api/client';
import {
  logout as logoutRequest,
  refreshTokens,
  type Session,
} from '@/services/api/auth';
import {
  clearSession,
  loadSession,
  saveSession,
} from '@/services/storage/secureSession';

type User = Session['user'];
export type SessionStatus = 'restoring' | 'signedIn' | 'signedOut';

type SessionContextValue = {
  status: SessionStatus;
  user: User | null;
  signIn: (session: Session) => Promise<void>;
  signOut: () => Promise<void>;
  /** Runs an API call with a valid access token, refreshing once on 401. */
  authorized: <T>(call: (accessToken: string) => Promise<T>) => Promise<T>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

const isAuthFailure = (e: unknown) => e instanceof ApiError && e.status === 401;

/**
 * Stays signed in like a shopping app should:
 * - the refresh token lives in the Keychain/Keystore, the access token
 *   (15 min) only in memory;
 * - on launch the stored refresh token is traded for a fresh pair, so the
 *   user lands on Home without signing in again;
 * - a 401 refreshes once (one request for all callers) and retries;
 * - only a rejected refresh token signs the user out.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('restoring');
  const [user, setUser] = useState<User | null>(null);
  const access = useRef<string | null>(null);
  const refresh = useRef<string | null>(null);
  const userRef = useRef<User | null>(null);
  const inFlight = useRef<Promise<string> | null>(null);

  const forget = useCallback(async () => {
    access.current = null;
    refresh.current = null;
    userRef.current = null;
    setUser(null);
    setStatus('signedOut');
    await clearSession();
  }, []);

  /** One refresh at a time; every waiting call gets the same new token. */
  const renew = useCallback((): Promise<string> => {
    if (inFlight.current) return inFlight.current;
    const token = refresh.current;
    if (!token || !userRef.current)
      return Promise.reject(new ApiError('Signed out', 401));
    const user_ = userRef.current;
    inFlight.current = refreshTokens(token)
      .then(async pair => {
        access.current = pair.accessToken;
        refresh.current = pair.refreshToken;
        await saveSession({ refreshToken: pair.refreshToken, user: user_ });
        return pair.accessToken;
      })
      .catch(async e => {
        if (isAuthFailure(e)) await forget();
        throw e;
      })
      .finally(() => {
        inFlight.current = null;
      });
    return inFlight.current;
  }, [forget]);

  // Restore on launch.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await loadSession();
      if (cancelled) return;
      if (!stored) return setStatus('signedOut');
      refresh.current = stored.refreshToken;
      userRef.current = stored.user;
      setUser(stored.user);
      try {
        await renew();
        if (!cancelled) setStatus('signedIn');
      } catch (e) {
        // Offline at launch: stay signed in; calls retry the refresh.
        if (!cancelled && !isAuthFailure(e)) setStatus('signedIn');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [renew]);

  const signIn = useCallback(async (session: Session) => {
    access.current = session.accessToken;
    refresh.current = session.refreshToken;
    userRef.current = session.user;
    await saveSession({
      refreshToken: session.refreshToken,
      user: session.user,
    });
    setUser(session.user);
    setStatus('signedIn');
  }, []);

  const signOut = useCallback(async () => {
    const [a, r] = [access.current, refresh.current];
    await forget();
    // Best effort: revoke on the server; the device copy is already gone.
    if (a && r) logoutRequest(a, r).catch(() => {});
  }, [forget]);

  const authorized = useCallback(
    async <T,>(call: (accessToken: string) => Promise<T>): Promise<T> => {
      const token = access.current ?? (await renew());
      try {
        return await call(token);
      } catch (e) {
        if (!isAuthFailure(e)) throw e;
        return call(await renew());
      }
    },
    [renew],
  );

  const value = useMemo(
    () => ({ status, user, signIn, signOut, authorized }),
    [status, user, signIn, signOut, authorized],
  );
  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
