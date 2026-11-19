import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/**
 * True while the app is in the foreground. Timers, polling and looping
 * animations should stop when it is false: background work burns battery
 * and gets a cached app killed by the system.
 */
export function useAppActive() {
  const [active, setActive] = useState(AppState.currentState === 'active');
  useEffect(() => {
    const sub = AppState.addEventListener('change', s =>
      setActive(s === 'active'),
    );
    return () => sub.remove();
  }, []);
  return active;
}
