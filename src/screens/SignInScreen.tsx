import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TextInput, View } from 'react-native';

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
  const { setSession } = useSession();
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
      setSession(await verifyOtp(phone, value));
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
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
      <FormHeader title={phone ? 'Enter the code' : "What's your number?"}>
        <Text style={formText.body}>
          {phone
            ? `Sent by SMS to ${formatPhone(phone)}.`
            : "We'll text you a code to sign in or create your account."}
        </Text>
        {phone ? (
          <TextLink
            align="start"
            label="Change number"
            onPress={changeNumber}
            style={styles.inlineLink}
          />
        ) : null}
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
          {wait > 0 ? (
            <Text style={formText.body}>
              Resend code in 0:{String(wait).padStart(2, '0')}
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
  resend: { marginTop: spacing.lg, alignItems: 'flex-start' },
});
