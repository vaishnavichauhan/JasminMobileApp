import React, { useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/authScreen/LoginScreen/LoginScreen';
import SplashScreen from '../screens/authScreen/SplashScreen/SplashScreen';
import TabNavigation from './TabNavigation';
import HomeScreen from '../screens/homeScreen/HomeScreen/HomeScreen';
import OffersScreen from '../screens/homeScreen/OffersScreen/OffersScreen';
import PriceListScreen from '../screens/homeScreen/PriceListScreen/PriceListScreen';
import ReportsScreen from '../screens/homeScreen/ReportsScreen.tsx/ReportsScreen';
import TargetAchivement from '../screens/homeScreen/ReportsScreen.tsx/TargetAchivement';
import AlertMasterScreen from '../screens/homeScreen/AlertMasterScreen/AlertMasterScreen';
import ProfileScreen from '../screens/homeScreen/ProfileScreen/ProfileScreen';
import { useAuth } from '../context/AuthContext';
import { colors } from '../styles/variables';
import ActivityReportScreen from '../screens/homeScreen/ReportsScreen.tsx/ActivityReportScreen';
import AbmWiseReportScreen from '../screens/homeScreen/ReportsScreen.tsx/AbmWiseReportScreen';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  HomeScreen: undefined;
  Offers: undefined;
  OffersScreen: undefined;
  PriceList: undefined;
  Reports: undefined;
  TargetAchivement: undefined;
  ActivityReportScreen:undefined;
  AbmWiseReportScreen:undefined;
  AlertMaster: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AuthNavigation = () => {
  const { isLoggedIn, isLoading } = useAuth();
  const [splashDone, setSplashDone] = useState(false);

  // Show spinner while AsyncStorage is loading session data
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.primary,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color={colors.white} />
      </View>
    );
  }

  // Show splash on first launch (before auth check resolves to a screen)
  if (!splashDone) {
    return <SplashScreen onFinish={() => setSplashDone(true)} />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.white },
        animation: 'slide_from_right',
      }}
    >
      {isLoggedIn ? (
        <>
          <Stack.Screen name="Home" component={TabNavigation} />
          <Stack.Screen name="HomeScreen" component={HomeScreen} />
          <Stack.Screen name="Offers" component={OffersScreen} />
          <Stack.Screen name="OffersScreen" component={OffersScreen} />
          <Stack.Screen name="PriceList" component={PriceListScreen} />
          <Stack.Screen name="Reports" component={ReportsScreen} />
          <Stack.Screen name="ActivityReportScreen" component={ActivityReportScreen} />
          <Stack.Screen name="TargetAchivement" component={TargetAchivement} />
          <Stack.Screen name="AbmWiseReportScreen" component={AbmWiseReportScreen} />
          <Stack.Screen name="AlertMaster" component={AlertMasterScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
};

export default AuthNavigation;
