import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * Current keyboard height, including when the keyboard was already open
 * as the screen mounted (KeyboardAvoidingView misses that case).
 */
export function useKeyboardHeight() {
  const [height, setHeight] = useState(() =>
    Keyboard.isVisible() ? Keyboard.metrics()?.height ?? 0 : 0,
  );

  useEffect(() => {
    const show = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hide = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const subs = [
      Keyboard.addListener(show, e => setHeight(e.endCoordinates.height)),
      Keyboard.addListener(hide, () => setHeight(0)),
    ];
    return () => subs.forEach(s => s.remove());
  }, []);

  return height;
}
