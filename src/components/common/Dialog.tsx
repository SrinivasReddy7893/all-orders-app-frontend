import { TriangleAlert, type LucideIcon } from 'lucide-react-native';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Modal,
  PixelRatio,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  colors,
  display,
  durations,
  easeOut,
  font,
  radius,
  spacing,
  typography,
} from '@/theme';

import { DatePickerSheet, type DatePickSpec } from './DatePickerSheet';

type Tone = 'default' | 'danger';

export type DialogAction = {
  label: string;
  /** primary: the main choice; danger: destructive; default: everything else. */
  tone?: 'default' | 'primary' | 'danger';
  /** Shown beside the label in a sheet. */
  icon?: LucideIcon;
  onPress?: () => void;
};

export type DialogSpec = {
  title: string;
  message?: string;
  icon?: LucideIcon;
  tone?: Tone;
  actions: DialogAction[];
  /** center: a card for a decision; sheet: a list of choices from the bottom. */
  layout?: 'center' | 'sheet';
};

type DialogApi = {
  show: (spec: DialogSpec) => void;
  /** A yes/no decision. The confirm button is primary, or danger when tone is. */
  confirm: (opts: {
    title: string;
    message?: string;
    icon?: LucideIcon;
    tone?: Tone;
    confirmLabel: string;
    cancelLabel?: string;
    onConfirm: () => void;
  }) => void;
  /** A message with one way out. */
  notice: (title: string, message?: string) => void;
  /** Asks which day something happened. */
  pickDate: (spec: DatePickSpec) => void;
};

const DialogContext = createContext<DialogApi>({
  show: () => undefined,
  confirm: () => undefined,
  notice: () => undefined,
  pickDate: () => undefined,
});

export const useDialog = () => useContext(DialogContext);

/**
 * One dialog for the whole app, in the app's own colours and type, in place
 * of the system alert. A decision is a centred card with the main choice on
 * ink (or red when it destroys something); a list of choices rises from the
 * bottom like the order sheet. Enter 240ms ease-out, exit 160ms; with Reduce
 * Motion it only fades. Tapping outside, or Back, is always "no".
 */
export function DialogProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [spec, setSpec] = useState<DialogSpec | null>(null);
  const [picker, setPicker] = useState<DatePickSpec | null>(null);
  const anim = useRef(new Animated.Value(0)).current;
  const reduce = useRef(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(r => (reduce.current = r));
  }, []);

  const close = useCallback(
    (then?: () => void) => {
      anim.stopAnimation();
      Animated.timing(anim, {
        toValue: 0,
        duration: reduce.current ? durations.reducedFade : 160,
        easing: easeOut,
        useNativeDriver: true,
      }).start(() => {
        setSpec(null);
        then?.();
      });
    },
    [anim],
  );

  const show = useCallback(
    (next: DialogSpec) => {
      setSpec(next);
      anim.stopAnimation();
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: reduce.current ? durations.reducedFade : 240,
        easing: easeOut,
        useNativeDriver: true,
      }).start();
    },
    [anim],
  );

  const api = useMemo<DialogApi>(
    () => ({
      show,
      confirm: o =>
        show({
          title: o.title,
          message: o.message,
          icon: o.icon,
          tone: o.tone,
          actions: [
            { label: o.cancelLabel ?? 'Not now' },
            {
              label: o.confirmLabel,
              tone: o.tone === 'danger' ? 'danger' : 'primary',
              onPress: o.onConfirm,
            },
          ],
        }),
      notice: (title, message) =>
        show({
          title,
          message,
          icon: TriangleAlert,
          tone: 'danger',
          actions: [{ label: 'OK', tone: 'primary' }],
        }),
      pickDate: setPicker,
    }),
    [show],
  );

  const sheet = spec?.layout === 'sheet';
  const rise = reduce.current ? 0 : sheet ? 48 : 14;

  return (
    <DialogContext.Provider value={api}>
      {children}
      <Modal
        visible={!!spec}
        transparent
        animationType="none"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => close()}
      >
        <View
          style={[styles.root, sheet ? styles.rootSheet : styles.rootCenter]}
        >
          <Animated.View style={[styles.scrim, { opacity: anim }]}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => close()}
              accessibilityLabel="Close"
            />
          </Animated.View>
          {spec ? (
            <Animated.View
              accessibilityViewIsModal
              style={[
                sheet ? styles.sheet : styles.card,
                sheet && { paddingBottom: insets.bottom + spacing.md },
                {
                  opacity: anim,
                  transform: [
                    {
                      translateY: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [rise, 0],
                      }),
                    },
                    ...(sheet || reduce.current
                      ? []
                      : [
                          {
                            scale: anim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.96, 1],
                            }),
                          },
                        ]),
                  ],
                },
              ]}
            >
              {sheet ? (
                <SheetBody spec={spec} onPick={a => close(a.onPress)} />
              ) : (
                <CardBody spec={spec} onPick={a => close(a.onPress)} />
              )}
            </Animated.View>
          ) : null}
        </View>
      </Modal>
      <DatePickerSheet spec={picker} onClose={() => setPicker(null)} />
    </DialogContext.Provider>
  );
}

function Heading({ spec }: { spec: DialogSpec }) {
  const Icon = spec.icon;
  const danger = spec.tone === 'danger';
  return (
    <>
      {Icon ? (
        <View style={[styles.tile, danger && styles.tileDanger]}>
          <Icon
            size={22}
            color={danger ? colors.dangerText : colors.emberText}
            strokeWidth={2.2}
          />
        </View>
      ) : null}
      <View style={styles.copy}>
        <Text style={styles.title} accessibilityRole="header">
          {spec.title}
        </Text>
        {spec.message ? (
          <Text style={styles.message}>{spec.message}</Text>
        ) : null}
      </View>
    </>
  );
}

function CardBody({
  spec,
  onPick,
}: {
  spec: DialogSpec;
  onPick: (a: DialogAction) => void;
}) {
  // Big system text or three choices: stack them, main choice first.
  const stacked = spec.actions.length > 2 || PixelRatio.getFontScale() >= 1.2;
  const ordered = stacked ? [...spec.actions].reverse() : spec.actions;
  return (
    <>
      <Heading spec={spec} />
      <View style={stacked ? styles.stack : styles.pair}>
        {ordered.map(a => (
          <Pressable
            key={a.label}
            onPress={() => onPick(a)}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.button,
              !stacked && styles.buttonFlex,
              a.tone === 'primary' && styles.buttonPrimary,
              a.tone === 'danger' && styles.buttonDanger,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.buttonText,
                (a.tone === 'primary' || a.tone === 'danger') &&
                  styles.buttonTextOn,
              ]}
              numberOfLines={1}
            >
              {a.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </>
  );
}

function SheetBody({
  spec,
  onPick,
}: {
  spec: DialogSpec;
  onPick: (a: DialogAction) => void;
}) {
  const choices = spec.actions.filter(a => a.tone !== undefined || a.icon);
  const close = spec.actions.find(a => !a.icon && a.tone === undefined);
  return (
    <>
      <View style={styles.grabber} />
      <View style={styles.sheetHead}>
        <Text
          style={styles.sheetTitle}
          numberOfLines={2}
          accessibilityRole="header"
        >
          {spec.title}
        </Text>
        {spec.message ? (
          <Text style={styles.sheetMessage} numberOfLines={1}>
            {spec.message}
          </Text>
        ) : null}
      </View>
      <View style={styles.rows}>
        {choices.map(a => {
          const Icon = a.icon;
          const danger = a.tone === 'danger';
          return (
            <Pressable
              key={a.label}
              onPress={() => onPick(a)}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.row,
                pressed && styles.rowPressed,
              ]}
            >
              {Icon ? (
                <View style={[styles.rowTile, danger && styles.tileDanger]}>
                  <Icon
                    size={20}
                    color={danger ? colors.dangerText : colors.emberText}
                    strokeWidth={2.2}
                  />
                </View>
              ) : null}
              <Text style={[styles.rowText, danger && styles.rowTextDanger]}>
                {a.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        onPress={() => (close ? onPick(close) : onPick({ label: 'Close' }))}
        accessibilityRole="button"
        style={({ pressed }) => [styles.closeRow, pressed && styles.pressed]}
      >
        <Text style={styles.closeText}>{close?.label ?? 'Close'}</Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  rootCenter: { justifyContent: 'center', paddingHorizontal: spacing.lg },
  rootSheet: { justifyContent: 'flex-end' },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(28, 20, 16, 0.52)',
  },
  card: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 380,
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: 28,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    boxShadow: '0px 24px 48px rgba(60, 20, 5, 0.22)',
  },
  sheet: {
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: colors.surface,
    boxShadow: '0px -12px 32px rgba(60, 20, 5, 0.16)',
  },
  tile: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.emberTint,
  },
  tileDanger: { backgroundColor: colors.dangerTint },
  copy: { gap: spacing.xs },
  title: {
    ...display,
    fontSize: 21,
    lineHeight: 27,
    letterSpacing: -0.3,
    color: colors.textPrimary,
  },
  message: { ...typography.body, color: colors.textSecondary },
  pair: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  stack: { gap: spacing.xs + 2, marginTop: spacing.xs },
  button: {
    minHeight: 52,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  buttonFlex: { flex: 1 },
  buttonPrimary: { backgroundColor: colors.ink, borderColor: colors.ink },
  buttonDanger: {
    backgroundColor: colors.dangerText,
    borderColor: colors.dangerText,
  },
  buttonText: { ...font('bold'), fontSize: 15, color: colors.textPrimary },
  buttonTextOn: { color: colors.onInk },
  pressed: { opacity: 0.7 },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.hairline,
    marginBottom: spacing.xs,
  },
  sheetHead: {
    gap: 2,
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.xs,
  },
  sheetTitle: {
    ...display,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.2,
    color: colors.textPrimary,
  },
  sheetMessage: { ...typography.caption, color: colors.textSecondary },
  rows: { gap: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 56,
    paddingHorizontal: spacing.xs,
    borderRadius: 16,
  },
  rowPressed: { backgroundColor: colors.canvas },
  rowTile: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.emberTint,
  },
  rowText: { ...font('medium'), fontSize: 16, color: colors.textPrimary },
  rowTextDanger: { color: colors.dangerText },
  closeRow: {
    minHeight: 52,
    marginTop: spacing.xs,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.canvas,
  },
  closeText: { ...font('bold'), fontSize: 15, color: colors.textPrimary },
});
