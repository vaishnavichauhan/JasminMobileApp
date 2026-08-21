import React, { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StatusBar,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  Image,
  ToastAndroid,
  TouchableOpacity,
} from 'react-native';
import { styles } from './LoginScreenStyles';
import TextInputes from '../../../components/TextInputes/TextInputes';
import Button from '../../../components/Button/Button';
import Images from '../../../assets/images';
import { colors } from '../../../styles/variables';
import { loginApi } from '../../../api/authApi';
import DeviceInfo from 'react-native-device-info';
import { useAuth } from '../../../context/AuthContext';

interface LoginScreenProps {
  navigation?: any;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ username?: string; password?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const { login } = useAuth();

  const handleSignIn = async () => {
    // Dismiss keyboard
    Keyboard.dismiss();
    setServerError(null);

    const newErrors: { username?: string; password?: string } = {};

    if (!username.trim()) {
      newErrors.username = 'Username is required';
    }
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setError(newErrors);
      return;
    }

    setError({});
    setLoading(true);

    try {
      let uniqueDeviceId = '';
      try {
        uniqueDeviceId = await DeviceInfo.getUniqueId();
      } catch (e) {
        console.warn('DeviceInfo getUniqueId error:', e);
      }

      const obj = {
        username: username.trim(),
        password: password,
        deviceId: uniqueDeviceId || `${Platform.OS}-device`,
        mobile: true
      };

      const response = await loginApi(obj);
      console.log('Login response:', response);

      const isDeviceRegRequired =
        response.status === 'DEVICE_REGISTRATION_REQUIRED' ||
        response.data?.status === 'DEVICE_REGISTRATION_REQUIRED' ||
        response.status === 'device_registration_required' ||
        response.data?.status === 'device_registration_required';

      if (isDeviceRegRequired) {
        setLoading(false);
        const resolvedDeviceId =
          response.deviceId ||
          response.data?.deviceId ||
          obj.deviceId;

        const approvedDevices =
          response.approvedDevices ||
          response.data?.approvedDevices ||
          [];

        navigation?.navigate('DeviceRegistration', {
          username: username.trim(),
          password: password,
          deviceId: resolvedDeviceId,
          approvedDevices: approvedDevices,
        });
        return;
      }

      const userData = response.user || response.data || { username: username.trim() };
      const authToken = response.token || response.accessToken;
      const authRefreshToken = response.refreshToken || response.data?.refreshToken;

      setLoading(false);

      if (Platform.OS === 'android') {
        ToastAndroid.show('Login Successfully', ToastAndroid.SHORT);
      }

      await login(userData, authToken, authRefreshToken);
    } catch (err: any) {
      setLoading(false);
      const errMsg = err?.message || 'Invalid Credentials';
      setServerError(errMsg);
      // Alert.alert('Login Error...', errMsg);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
          overScrollMode="always"
        >
          {/* Header with Logo & Titles */}
          <View style={styles.headerContainer}>
            <View style={styles.logoWrapper}>
              <Image
                source={Images.logo}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to your ERP dashboard</Text>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            {/* Inline Server Error Banner */}
            {serverError ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerIcon}>⚠️</Text>
                <View style={styles.errorBannerContent}>
                  <Text style={styles.errorBannerTitle}>Login Error</Text>
                  <Text style={styles.errorBannerText}>{serverError}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setServerError(null)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.errorBannerClose}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Username Input with PNG User Icon */}
            <TextInputes
              label="USERNAME"
              placeholder="Enter your username"
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                if (error.username) setError((prev) => ({ ...prev, username: undefined }));
                if (serverError) setServerError(null);
              }}
              leftIcon={
                <Image
                  source={Images.user}
                  style={styles.inputIcon}
                  resizeMode="contain"
                />
              }
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              error={error.username}
            />

            {/* Password Input with PNG Lock Icon & PNG Eye Toggle */}
            <TextInputes
              label="PASSWORD"
              placeholder="Enter your password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (error.password) setError((prev) => ({ ...prev, password: undefined }));
                if (serverError) setServerError(null);
              }}
              leftIcon={
                <Image
                  source={Images.lock}
                  style={styles.inputIcon}
                  resizeMode="contain"
                />
              }
              isPassword={true}
              returnKeyType="done"
              onSubmitEditing={handleSignIn}
              error={error.password}
            />

            {/* Sign In Button with PNG ArrowRight Icon */}
            <Button
              title="Sign In"
              onPress={handleSignIn}
              loading={loading}
              icon={
                <Image
                  source={Images.arrowRight}
                  style={styles.buttonIcon}
                  resizeMode="contain"
                />
              }
              iconPosition="right"
              style={styles.signInButton}
              textStyle={styles.signInButtonText}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default LoginScreen;
