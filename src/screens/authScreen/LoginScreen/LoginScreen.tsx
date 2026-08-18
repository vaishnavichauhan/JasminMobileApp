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
  const { login } = useAuth();

  const handleSignIn = async () => {
    // Dismiss keyboard
    Keyboard.dismiss();

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
      const successMsg =
        response.message || response.msg || response.detail || 'Logged in successfully!';

      setLoading(false);

      Alert.alert(
        'Login Successful',
        successMsg,
        [
          {
            text: 'OK',
            onPress: async () => {
              await login(userData, authToken);
            },
          },
        ],
        { cancelable: false }
      );
    } catch (err: any) {
      setLoading(false);
      Alert.alert('Login Error...', err.message || 'An error occurred during login');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
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
              {/* Username Input with PNG User Icon */}
              <TextInputes
                label="USERNAME"
                placeholder="Enter your username"
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  if (error.username) setError((prev) => ({ ...prev, username: undefined }));
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
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
};

export default LoginScreen;
