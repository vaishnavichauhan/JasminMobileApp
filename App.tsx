/**
 * Jasmin Mobile Application
 */

import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import AuthNavigation from './src/navigation/AuthNavigation';
import { colors } from './src/styles/variables';

function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor={colors.background} />
          <NavigationContainer>
            <AuthNavigation />
          </NavigationContainer>
        </View>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

export default App;
