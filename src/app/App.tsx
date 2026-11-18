import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { APP_NAME } from '@/constants/app';
import { colors, typography } from '@/theme';

function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to {APP_NAME} App</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
  },
});

export default App;
