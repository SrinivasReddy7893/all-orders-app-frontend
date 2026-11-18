import { ShieldCheck } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Animated,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/common/PrimaryButton';
import { LegalLine } from '@/components/common/LegalLine';
import { Logo } from '@/components/common/Logo';
import { APP_NAME } from '@/constants/app';
import { ACTIVE_HERO, HEROES } from '@/features/onboarding/components/heroes';
import { useEntrance } from '@/hooks/useEntrance';
import { colors, gradients, spacing, typography } from '@/theme';

type Props = {
  onGetStarted: () => void;
};

export function WelcomeScreen({ onGetStarted }: Props) {
  const insets = useSafeAreaInsets();
  const Hero = HEROES[ACTIVE_HERO];
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  // Display size follows the width so the headline keeps to two lines.
  const headlineSize = Math.min(
    40,
    Math.round((landscape ? height : width) * 0.092),
  );
  const [heroHeight, setHeroHeight] = useState<number>();
  // One choreographed entrance: hero, then the words, then the actions.
  const copy = useEntrance(120);
  const actions = useEntrance(220);

  const hero = (
    <View
      style={styles.hero}
      onLayout={e => setHeroHeight(e.nativeEvent.layout.height)}
    >
      {heroHeight ? <Hero maxHeight={heroHeight} /> : null}
    </View>
  );

  const text = (
    <Animated.View style={copy.style}>
      <Text
        style={[
          styles.headline,
          { fontSize: headlineSize, lineHeight: headlineSize * 1.08 },
        ]}
        accessibilityRole="header"
      >
        Your order emails,{'\n'}
        <Text style={styles.headlineMuted}>turned into one list.</Text>
      </Text>
      <Text style={styles.subhead}>
        See where every delivery is, from shopping to groceries.
      </Text>
    </Animated.View>
  );

  // Reassurance sits with the action it is about, mirroring the legal line.
  const cta = (
    <Animated.View style={[styles.actions, actions.style]}>
      <View style={styles.assurance}>
        <ShieldCheck size={15} color={colors.onEmberMuted} strokeWidth={2} />
        <Text style={styles.assuranceText}>Read-only access to your Gmail</Text>
      </View>
      <PrimaryButton label="Get started" onPress={onGetStarted} />
      <LegalLine />
    </Animated.View>
  );

  const brand = (
    <View style={styles.brand} accessibilityRole="header">
      <Logo size={landscape ? 48 : 84} shape="circle" />
      <Text style={styles.brandName}>{APP_NAME}</Text>
    </View>
  );

  return (
    <View
      style={[
        styles.screen,
        {
          paddingTop: insets.top + spacing.sm,
          paddingBottom: insets.bottom + spacing.sm,
          paddingLeft: insets.left + spacing.lg,
          paddingRight: insets.right + spacing.lg,
        },
      ]}
    >
      <StatusBar barStyle="light-content" />
      {landscape ? (
        <View style={styles.row}>
          <ScrollView
            style={styles.column}
            contentContainerStyle={styles.landscapeColumn}
          >
            {brand}
            <View style={styles.landscapeText}>{text}</View>
            {cta}
          </ScrollView>
          <View style={styles.column}>{hero}</View>
        </View>
      ) : (
        <>
          {brand}
          {hero}
          {text}
          {cta}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundImage: gradients.ember },
  row: { flex: 1, flexDirection: 'row', gap: spacing.xl },
  column: { flex: 1 },
  landscapeColumn: { flexGrow: 1, paddingBottom: spacing.md },
  landscapeText: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  // Centred brand moment: a large circular mark with the name beneath.
  brand: { alignItems: 'center', gap: spacing.sm },
  brandName: {
    ...typography.title,
    fontSize: 20,
    letterSpacing: -0.3,
    color: colors.onEmber,
  },
  hero: { flex: 1, justifyContent: 'center' },
  headline: { ...typography.display, color: colors.onEmber },
  headlineMuted: { color: colors.onEmberSubtle },
  subhead: {
    ...typography.body,
    fontSize: 16,
    lineHeight: 23,
    color: colors.onEmberMuted,
    marginTop: spacing.sm,
    maxWidth: 320,
  },
  // Rhythm: headline + subhead tight (12), a generous break (32) to the
  // action group, then the group itself tight (12–16).
  actions: { marginTop: spacing.xl, gap: spacing.sm },
  assurance: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  assuranceText: {
    ...typography.caption,
    fontSize: 13,
    color: colors.onEmberMuted,
  },
});
