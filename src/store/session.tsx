import React, { createContext, useContext, useMemo, useState } from 'react';

import type { Session } from '@/services/api/auth';

type SessionContextValue = {
  session: Session | null;
  setSession: (session: Session | null) => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

/**
 * In-memory session. Tokens are deliberately not persisted yet: they belong
 * in the platform keystore (Keychain / Android Keystore), never AsyncStorage.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const value = useMemo(() => ({ session, setSession }), [session]);
  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
