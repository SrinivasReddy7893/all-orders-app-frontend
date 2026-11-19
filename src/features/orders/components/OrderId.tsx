import Clipboard from '@react-native-clipboard/clipboard';
import { Check, Copy } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useToast } from '@/components/common/Toast';
import { usePressScale } from '@/hooks/usePressScale';
import { colors, font, radius, spacing, typography } from '@/theme';

/** Android 13+ shows its own clipboard confirmation; don't stack ours. */
const systemConfirmsCopy =
  Platform.OS === 'android' && Number(Platform.Version) >= 33;

/** Copies the ID, and reports "copied" for 1.5s so the control can confirm itself. */
function useCopyId(id: string) {
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

  return { copied, copy };
}

/**
 * The shop's order number, copyable with one tap. The pill itself
 * confirms: it turns green with a check and "Copied" for 1.5s, right
 * where the user is looking.
 */
export function OrderId({ id }: { id: string }) {
  const { copied, copy } = useCopyId(id);

  return (
    <Pressable
      onPress={copy}
      hitSlop={{ top: 11, bottom: 11, left: 6, right: 6 }}
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

/**
 * The ID given room: large, selectable, with an explicit Copy button that
 * turns into a green "Copied" tick. For the order sheet, where copying is
 * the point.
 */
export function OrderIdCard({ id }: { id: string }) {
  const { copied, copy } = useCopyId(id);
  const press = usePressScale(0.96);
  return (
    <View style={styles.card}>
      <View style={styles.cardText}>
        <Text style={styles.cardLabel}>Order ID</Text>
        <Text
          style={styles.cardId}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          selectable
        >
          {id}
        </Text>
      </View>
      <Pressable
        onPress={copy}
        hitSlop={{ top: 2, bottom: 2 }}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        accessibilityRole="button"
        accessibilityLabel={`Copy order ID ${id}`}
      >
        <Animated.View
          style={[styles.copyBtn, copied && styles.copyBtnDone, press.style]}
        >
          {copied ? (
            <Check size={16} color={colors.success} strokeWidth={2.8} />
          ) : (
            <Copy size={16} color={colors.textPrimary} strokeWidth={2.2} />
          )}
          <Text style={[styles.copyText, copied && styles.copyTextDone]}>
            {copied ? 'Copied' : 'Copy'}
          </Text>
        </Animated.View>
      </Pressable>
    </View>
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.canvas,
  },
  cardText: { flex: 1, gap: 2 },
  cardLabel: { ...typography.caption, color: colors.textSecondary },
  cardId: {
    ...font('medium'),
    fontSize: 17,
    lineHeight: 22,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  copyBtnDone: {
    backgroundColor: colors.successTint,
    borderColor: colors.successTint,
  },
  copyText: { ...typography.label, color: colors.textPrimary },
  copyTextDone: { color: colors.success },
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
