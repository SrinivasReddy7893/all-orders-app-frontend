import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { CodeInput } from '@/components/common/CodeInput';
import { FormHeader, formText } from '@/components/common/FormHeader';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ScreenShell } from '@/components/common/ScreenShell';
import { TextLink } from '@/components/common/TextLink';
import { useEntrance } from '@/hooks/useEntrance';
import { useShake } from '@/hooks/useShake';
import type { RootStackParamList } from '@/navigation/types';
import { sendOtp, verifyOtp } from '@/services/api/auth';
import { describeError } from '@/services/api/errors';
import { useSession } from '@/store/session';
import { colors, radius, spacing, typography } from '@/theme';
import {
  cleanPhoneInput,
  formatPhone,
  groupDigits,
  isValidIndianMobile,
  phoneHint,
  toE164India,
} from '@/utils/phone';

type Props = NativeStackScreenProps<RootStackParamList, 'SignIn'>;

const CODE_LENGTH = 6;
const RESEND_SECONDS = 60; // matches the backend's resend cooldown

/**
 * Sign-up and sign-in in one screen: number, then the code appears right
 * below. The keyboard never closes and the code submits itself.
 */
export function SignInScreen({ navigation }: Props) {
  const { signIn } = useSession();
  const codeRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const [digits, setDigits] = useState('');
  const [phone, setPhone] = useState<string>(); // set once a code was sent
  const [code, setCode] = useState('');
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [wait, setWait] = useState(0);
  const shake = useShake();

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait(w => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const sendCode = async () => {
    if (!isValidIndianMobile(digits) || loading) return;
    setLoading(true);
    setError(undefined);
    const e164 = toE164India(digits);
    try {
      await sendOtp(e164);
      setPhone(e164);
      setCode('');
      setWait(RESEND_SECONDS);
      requestAnimationFrame(() => codeRef.current?.focus());
    } catch (e) {
      setError(describeError(e));
    } finally {
      setLoading(false);
    }
  };

  const verify = async (value = code) => {
    if (!phone || value.length !== CODE_LENGTH || loading) return;
    setLoading(true);
    setError(undefined);
    try {
      await signIn(await verifyOtp(phone, value));
    } catch (e) {
      setError(describeError(e));
      shake.shake();
      setCode('');
      codeRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const changeNumber = () => {
    setPhone(undefined);
    setCode('');
    setError(undefined);
  };

  return (
    <ScreenShell
      onBack={navigation.goBack}
      footer={
        phone ? (
          <PrimaryButton
            label="Verify"
            onPress={() => verify()}
            disabled={code.length !== CODE_LENGTH}
            loading={loading}
          />
        ) : (
          <PrimaryButton
            label="Send code"
            onPress={sendCode}
            disabled={!isValidIndianMobile(digits)}
            loading={loading}
          />
        )
      }
    >
      <FormHeader
        title={phone ? 'Enter the 6-digit code' : "What's your number?"}
      >
        {phone ? (
          <View style={styles.sentRow}>
            <Text style={formText.body}>
              Sent to <Text style={styles.sentPhone}>{formatPhone(phone)}</Text>
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit phone number"
              onPress={changeNumber}
              hitSlop={10}
              style={({ pressed }) => [styles.edit, pressed && styles.pressed]}
            >
              <Text style={styles.editText}>Edit</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={formText.body}>
            We'll text you a code to sign in or create your account.
          </Text>
        )}
      </FormHeader>

      {phone ? (
        <CodeStep
          code={code}
          onChange={next => {
            setCode(next);
            setError(undefined);
            if (next.length === CODE_LENGTH) verify(next);
          }}
          codeRef={codeRef}
          error={!!error}
          busy={loading}
          shake={shake.style}
        />
      ) : (
        <View
          style={[
            styles.field,
            focused && styles.fieldFocused,
            !!error && styles.fieldError,
          ]}
        >
          <Text style={styles.prefix}>+91</Text>
          <View style={styles.divider} />
          <TextInput
            accessibilityLabel="Mobile number"
            value={groupDigits(digits)}
            onChangeText={t => {
              setDigits(cleanPhoneInput(t));
              setError(undefined);
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onSubmitEditing={sendCode}
            placeholder="98765 43210"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
            autoComplete="tel-national"
            textContentType="telephoneNumber"
            returnKeyType="done"
            autoFocus
            maxLength={11}
            style={styles.input}
          />
        </View>
      )}

      {!phone && !error && phoneHint(digits) ? (
        <Text style={styles.hint} accessibilityLiveRegion="polite">
          {phoneHint(digits)}
        </Text>
      ) : null}

      {error ? (
        <Text
          style={formText.error}
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
        >
          {error}
        </Text>
      ) : null}

      {phone ? (
        <View style={styles.resend}>
          {loading ? (
            <View style={styles.checking}>
              <ActivityIndicator size="small" color={colors.onEmberMuted} />
              <Text style={styles.resendText}>Checking code…</Text>
            </View>
          ) : wait > 0 ? (
            <Text style={styles.resendText}>
              Didn't get it? Resend in 0:{String(wait).padStart(2, '0')}
            </Text>
          ) : (
            <TextLink
              align="start"
              label="Resend code"
              onPress={sendCode}
              style={styles.inlineLink}
            />
          )}
        </View>
      ) : null}
    </ScreenShell>
  );
}

/** The code boxes arrive with one short rise (fade only under reduced motion). */
function CodeStep(
  props: Omit<React.ComponentProps<typeof CodeInput>, 'value' | 'ref'> & {
    code: string;
    codeRef: React.RefObject<React.ComponentRef<typeof TextInput> | null>;
  },
) {
  const { code, codeRef, ...rest } = props;
  const enter = useEntrance(0, 12);
  return (
    <Animated.View style={enter.style}>
      <CodeInput ref={codeRef} value={code} {...rest} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  inlineLink: {
    ...typography.label,
    color: colors.onEmber,
    textDecorationLine: 'underline',
  },
  field: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  fieldFocused: { borderColor: colors.ink },
  fieldError: { borderColor: colors.emberText },
  prefix: { ...typography.label, fontSize: 18, color: colors.textPrimary },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: colors.track,
    marginHorizontal: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.label,
    fontSize: 18,
    letterSpacing: 0.5,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  hint: {
    ...typography.caption,
    fontSize: 14,
    color: colors.onEmberSubtle,
    marginTop: spacing.sm,
    fontVariant: ['tabular-nums'],
  },
  resend: { marginTop: spacing.lg, minHeight: 24, justifyContent: 'center' },
  resendText: {
    ...typography.body,
    fontSize: 15,
    color: colors.onEmberSubtle,
    fontVariant: ['tabular-nums'],
  },
  checking: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  sentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sentPhone: { ...typography.label, fontSize: 16, color: colors.onEmber },
  edit: {
    paddingHorizontal: spacing.sm,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    justifyContent: 'center',
  },
  editText: { ...typography.label, fontSize: 13, color: colors.onEmber },
  pressed: { opacity: 0.7 },
});
