import React, { useState, useEffect } from 'react';
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
  TouchableOpacity,
} from 'react-native';
import { styles } from './DeviceRegistrationScreenStyles';
import TextInputes from '../../../components/TextInputes/TextInputes';
import Button from '../../../components/Button/Button';
import Images from '../../../assets/images';
import { colors } from '../../../styles/variables';
import { requestDeviceApi, ApprovedDeviceItem } from '../../../api/authApi';
import DeviceInfo from 'react-native-device-info';

interface DeviceRegistrationScreenProps {
  navigation?: any;
  route?: {
    params?: {
      username?: string;
      password?: string;
      deviceId?: string;
      approvedDevices?: ApprovedDeviceItem[];
    };
  };
}

const DeviceRegistrationScreen: React.FC<DeviceRegistrationScreenProps> = ({
  navigation,
  route,
}) => {
  const initialUsername = route?.params?.username || '';
  const initialPassword = route?.params?.password || '';
  const initialDeviceId = route?.params?.deviceId || '';
  const approvedDevices = route?.params?.approvedDevices || [];

  const [username, setUsername] = useState(initialUsername);
  const [deviceId, setDeviceId] = useState(initialDeviceId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ username?: string; deviceId?: string }>({});

  useEffect(() => {
    // If deviceId wasn't passed in params, get device unique ID
    if (!initialDeviceId) {
      const fetchDeviceId = async () => {
        try {
          const uniqueId = await DeviceInfo.getUniqueId();
          setDeviceId(uniqueId || `${Platform.OS}-device`);
        } catch (e) {
          console.warn('Error fetching device ID:', e);
          setDeviceId(`${Platform.OS}-device`);
        }
      };
      fetchDeviceId();
    }
  }, [initialDeviceId]);

  const handleSubmitForApproval = async () => {
    Keyboard.dismiss();

    const newErrors: { username?: string; deviceId?: string } = {};

    if (!username.trim()) {
      newErrors.username = 'Username is required';
    }
    if (!deviceId.trim()) {
      newErrors.deviceId = 'Device ID is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setError(newErrors);
      return;
    }

    setError({});
    setLoading(true);

    try {
      const payload = {
        username: username.trim(),
        password: initialPassword,
        deviceId: deviceId.trim(),
      };

      const response = await requestDeviceApi(payload);
      console.log('deviceresponse..', response);

      setLoading(false);

      const successMessage =
        response.message ||
        response.msg ||
        'Device registration request submitted successfully! Please wait for administrator approval.';

      Alert.alert(
        'Request Submitted',
        successMessage,
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('Login');
            },
          },
        ],
        { cancelable: false }
      );
    } catch (err: any) {
      console.log('err', err);
      setLoading(false);

      const errorMsg = (err.message || '').toLowerCase();
      const isLimitReached =
        errorMsg.includes('limit') ||
        errorMsg.includes('maximum') ||
        errorMsg.includes('3 devices') ||
        errorMsg.includes('replace') ||
        err.data?.status === 'DEVICE_LIMIT_REACHED' ||
        err.status === 'DEVICE_LIMIT_REACHED';

      const latestApprovedDevices =
        err.approvedDevices && err.approvedDevices.length > 0
          ? err.approvedDevices
          : approvedDevices && approvedDevices.length > 0
          ? approvedDevices
          : [];

      if (isLimitReached || (latestApprovedDevices && latestApprovedDevices.length >= 3)) {
        navigation.navigate('DeviceLimitReached', {
          username: username.trim(),
          password: initialPassword,
          deviceId: deviceId.trim(),
          approvedDevices: latestApprovedDevices,
        });
        return;
      }

      Alert.alert(
        'Registration Failed',
        err.message || 'Unable to submit device registration request. Please try again.'
      );
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
            {/* Header with Lock Icon & Titles */}
            <View style={styles.headerContainer}>
              <View style={styles.lockIconCircle}>
                <Image
                  source={Images.lock}
                  style={styles.lockIcon}
                  resizeMode="contain"
                />
              </View>

              <Text style={styles.title}>Register Device</Text>
              <Text style={styles.subtitle}>
                This device needs administrator approval before you can log in.
              </Text>
            </View>

            {/* Registration Card */}
            <View style={styles.card}>
              {/* Username Input */}
              <TextInputes
                label="USERNAME"
                placeholder="Enter username"
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

              {/* Device Signature Input */}
              <TextInputes
                label="DEVICE SIGNATURE"
                placeholder="Enter device signature"
                value={deviceId}
                onChangeText={(text) => {
                  setDeviceId(text);
                  if (error.deviceId) setError((prev) => ({ ...prev, deviceId: undefined }));
                }}
                leftIcon={
                  <Image
                    source={Images.lock}
                    style={styles.inputIcon}
                    resizeMode="contain"
                  />
                }
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleSubmitForApproval}
                error={error.deviceId}
              />

              <Text style={styles.helperText}>
                A unique hardware-based signature for this browser/device.
              </Text>

              {/* Submit for Approval Button */}
              <Button
                title="Submit for Approval"
                onPress={handleSubmitForApproval}
                loading={loading}
                style={styles.submitButton}
                textStyle={styles.submitButtonText}
              />

              {/* Back to Login */}
              <TouchableOpacity
                style={styles.backToLoginButton}
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.7}
              >
                <Text style={styles.backToLoginText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
};

export default DeviceRegistrationScreen;
