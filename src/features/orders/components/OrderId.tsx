import Clipboard from '@react-native-clipboard/clipboard';
import { Check, Copy } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Platform,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';

import { useToast } from '@/components/common/Toast';
import { colors, radius, typography } from '@/theme';

/** Android 13+ shows its own clipboard confirmation; don't stack ours. */
const systemConfirmsCopy =
  Platform.OS === 'android' && Number(Platform.Version) >= 33;

/**
 * The shop's order number, copyable with one tap. The pill itself
 * confirms: it turns green with a check and "Copied" for 1.5s, right
 * where the user is looking.
 */
export function OrderId({ id }: { id: string }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = () => {
    Clipboard.setString(id);
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1500);
    if (systemConfirmsCopy)
      AccessibilityInfo.announceForAccessibility('Order ID copied');
    else toast('Order ID copied');
  };

  return (
    <Pressable
      onPress={copy}
      hitSlop={{ top: 8, bottom: 8 }}
      accessibilityRole="button"
      accessibilityLabel={`Order ID ${id}`}
      accessibilityHint="Copies the order ID"
      style={({ pressed }) => [
        styles.pill,
        copied && styles.pillCopied,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[styles.text, copied && styles.textCopied]}
        numberOfLines={1}
      >
        {copied ? 'Copied' : `#${id}`}
      </Text>
      {copied ? (
        <Check size={13} color={colors.success} strokeWidth={2.8} />
      ) : (
        <Copy size={12} color={colors.textSecondary} strokeWidth={2.2} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    height: 26,
    paddingHorizontal: 8,
    borderRadius: radius.sm - 2,
    backgroundColor: colors.canvas,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    flexShrink: 1,
  },
  pillCopied: {
    backgroundColor: colors.successTint,
    borderColor: colors.successTint,
  },
  pressed: { backgroundColor: colors.track, transform: [{ scale: 0.97 }] },
  text: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
    flexShrink: 1,
  },
  textCopied: { ...typography.label, fontSize: 12, color: colors.success },
});
