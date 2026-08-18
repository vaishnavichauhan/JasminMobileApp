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
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { styles } from './DeviceLimitReachedScreenStyles';
import { colors } from '../../../styles/variables';
import { requestDeviceApi, ApprovedDeviceItem } from '../../../api/authApi';

interface DeviceLimitReachedScreenProps {
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

const formatDeviceId = (id?: string): string => {
  if (!id) return 'Unknown Device';
  if (id.length > 14) {
    return `${id.slice(0, 6)}...${id.slice(-6)}`;
  }
  return id;
};

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch {
    return dateStr;
  }
};

const DeviceLimitReachedScreen: React.FC<DeviceLimitReachedScreenProps> = ({
  navigation,
  route,
}) => {
  const username = route?.params?.username || '';
  const password = route?.params?.password || '';
  const deviceId = route?.params?.deviceId || '';
  const approvedDevices = route?.params?.approvedDevices || [];

  const [selectedDeviceId, setSelectedDeviceId] = useState<number | string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleConfirmAndSubmit = async () => {
    if (selectedDeviceId === null) {
      Alert.alert('Selection Required', 'Please select a device to replace.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        username: username.trim(),
        password: password,
        deviceId: deviceId.trim(),
        revokeDeviceId: selectedDeviceId,
      };

      console.log('Submitting revoke device payload:', payload);

      const response = await requestDeviceApi(payload);
      console.log('Revoke device response:', response);

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
      setLoading(false);
      console.log('Revoke device error:', err);
      Alert.alert(
        'Request Failed',
        err.message || 'Unable to submit device replacement request. Please try again.'
      );
    }
  };

  const handleCancel = () => {
    navigation.navigate('Login');
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
            <View style={styles.modalCard}>
              {/* Header */}
              <View style={styles.headerRow}>
                <View style={styles.headerTitleContainer}>
                  <View style={styles.warningIconContainer}>
                    <Text style={styles.warningIconText}>⚠️</Text>
                  </View>
                  <Text style={styles.headerTitle}>
                    Device Limit Reached ({approvedDevices.length > 0 ? `${approvedDevices.length}/3` : '3/3'})
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleCancel}
                  activeOpacity={0.7}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Subtitle description */}
              <Text style={styles.subtitle}>
                You already have 3 active devices. Please choose one device below that you wish to replace once this new request is approved:
              </Text>

              {/* Device List */}
              <View style={styles.deviceListContainer}>
                {approvedDevices.map((item, index) => {
                  const isSelected = selectedDeviceId === item.id;
                  const dateString = item.submitted_at || item.approved_at || item.created_at;

                  return (
                    <TouchableOpacity
                      key={item.id ? String(item.id) : String(index)}
                      style={[
                        styles.deviceItemCard,
                        isSelected && styles.deviceItemCardSelected,
                      ]}
                      onPress={() => setSelectedDeviceId(item.id)}
                      activeOpacity={0.8}
                    >
                      {/* Radio Circle */}
                      <View
                        style={[
                          styles.radioOuter,
                          isSelected && styles.radioOuterSelected,
                        ]}
                      >
                        {isSelected && <View style={styles.radioInner} />}
                      </View>

                      {/* Device Details */}
                      <View style={styles.deviceInfoContainer}>
                        <Text style={styles.deviceName}>
                          Device {index + 1}: {formatDeviceId(item.device_id)}
                        </Text>
                        {dateString ? (
                          <Text style={styles.deviceDate}>
                            Approved: {formatDate(dateString)}
                          </Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancel}
                  activeOpacity={0.7}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    (selectedDeviceId === null || loading) && styles.confirmButtonDisabled,
                  ]}
                  onPress={handleConfirmAndSubmit}
                  disabled={selectedDeviceId === null || loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Confirm & Submit</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
};

export default DeviceLimitReachedScreen;
