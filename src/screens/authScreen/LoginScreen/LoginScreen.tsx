import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StatusBar,
  Keyboard,
  Image,
  ToastAndroid,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { styles } from './LoginScreenStyles';
import TextInputes from '../../../components/TextInputes/TextInputes';
import Button from '../../../components/Button/Button';
import Images from '../../../assets/images';
import { colors } from '../../../styles/variables';
import { loginApi } from '../../../api/authApi';
import DeviceInfo from 'react-native-device-info';
import { useAuth } from '../../../context/AuthContext';
import {
  triggerApkDownload,
  CURRENT_APP_VERSION,
} from '../../../api/appUpdateApi';
import { useAppUpdateStore } from '../../../store';

interface LoginScreenProps {
  navigation?: any;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ username?: string; password?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const { updateInfo, checkForUpdates, checkingUpdate } = useAppUpdateStore();
  const { login } = useAuth();
  const currentAppVersion = CURRENT_APP_VERSION;

  useEffect(() => {
    checkForUpdates();
  }, [checkForUpdates]);

  const handleManualCheckUpdate = async () => {
    try {
      const res = await checkForUpdates();
      console.log('[LoginScreen] Manual check for update result:', res);

      if (res?.updateRequired) {
        setUpdateModalVisible(true);
      } else if (res?.success) {
        Alert.alert(
          'App Up to Date',
          `You are already using the latest version of Jasmin Mobile App (v${currentAppVersion}).`
        );
      } else {
        Alert.alert(
          'Update Check Failed',
          'Could not retrieve update information from the server. Please check your network or server URL.'
        );
      }
    } catch (e: any) {
      console.warn('[LoginScreen] Manual check update error:', e);
      Alert.alert('Update Check Failed', e?.message || 'Something went wrong.');
    }
  };

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
      // 1. Compulsory Update Check: Check version first; block login if update is required
      const updateRes = await checkForUpdates();
      if (updateRes?.updateRequired) {
        setLoading(false);
        setUpdateModalVisible(true);
        return;
      }

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

          {/* Update Available Card */}
          {updateInfo?.updateRequired ? (
            <View style={styles.updateCard}>
              <View style={styles.updateCardHeader}>
                <View style={styles.updateHeaderLeft}>
                  <View style={styles.updateIconWrapper}>
                    <Text style={styles.updateIcon}>🚀</Text>
                  </View>
                  <View style={styles.updateHeaderTextWrap}>
                    <Text style={styles.updateTitle}>Update Available</Text>
                    <Text style={styles.updateSubtitle} numberOfLines={1}>
                      {updateInfo.message || 'Update is compulsory before login'}
                    </Text>
                  </View>
                </View>

                {/* Top-Right Update Button */}
                <View style={styles.updateHeaderRight}>
                  <TouchableOpacity
                    style={styles.headerUpdateBtn}
                    activeOpacity={0.8}
                    onPress={() =>
                      triggerApkDownload(
                        updateInfo.downloadUrl,
                        updateInfo.apkAvailable,
                        updateInfo.latestVersion
                      )
                    }
                  >
                    <Text style={styles.headerUpdateBtnIcon}>⬇️</Text>
                    <Text style={styles.headerUpdateBtnText}>Update</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : null}

          {/* Check for Updates Button */}
          <TouchableOpacity
            style={styles.checkUpdateBtn}
            onPress={handleManualCheckUpdate}
            disabled={checkingUpdate}
            activeOpacity={0.7}
          >
            {checkingUpdate ? (
              <View style={styles.checkUpdateContent}>
                <ActivityIndicator size="small" color={colors.primaryLight} />
                <Text style={styles.checkUpdateBtnText}>Checking for updates...</Text>
              </View>
            ) : (
              <View style={styles.checkUpdateContent}>
                <Text style={styles.checkUpdateBtnIcon}>🔄</Text>
                <Text style={styles.checkUpdateBtnText}>Check for Updates</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Dynamic App Version Footer */}
          <View style={styles.versionFooter}>
            <Text style={styles.versionFooterText}>
              Jasmin Mobile App Version • {currentAppVersion}
            </Text>
            {updateInfo && !updateInfo.updateRequired && (
              <View style={styles.upToDatePill}>
                <Text style={styles.upToDatePillText}>Latest ✓</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Custom Update Required Alert Modal with Close Icon */}
      <Modal
        visible={updateModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setUpdateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Close Icon in Top-Right */}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setUpdateModalVisible(false)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCloseIcon}>✕</Text>
            </TouchableOpacity>

            {/* Icon & Title */}
            <View style={styles.modalIconCircle}>
              <Text style={styles.modalIconText}>🚀</Text>
            </View>

            <Text style={styles.modalTitle}>Update Required</Text>

            <Text style={styles.modalMessage}>
              Update is required. A new version ({updateInfo?.latestVersion || 'latest'}) is available!
              {'\n\n'}Please update the application before logging in.
            </Text>

            {/* Action Buttons */}
            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                activeOpacity={0.7}
                onPress={() => setUpdateModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Close</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalUpdateBtn}
                activeOpacity={0.85}
                onPress={() => {
                  setUpdateModalVisible(false);
                  triggerApkDownload(
                    updateInfo?.downloadUrl,
                    updateInfo?.apkAvailable,
                    updateInfo?.latestVersion
                  );
                }}
              >
                <Text style={styles.modalUpdateBtnIcon}>⬇️</Text>
                <Text style={styles.modalUpdateBtnText}>Update Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default LoginScreen;
