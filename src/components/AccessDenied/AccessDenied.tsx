import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors, fontFamily, borderRadius, fontSize } from '../../styles/variables';
import Images from '../../assets/images';

interface AccessDeniedProps {
  message?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
  title?: string;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  message,
  onRetry,
  onGoBack,
  title = 'Access Denied',
}) => {
  const displayMessage =
    !message ||
    message.toLowerCase().includes('insufficient permission') ||
    message.toLowerCase().includes('permission for') ||
    message.toLowerCase().includes('access denied') ||
    message.toLowerCase().includes('forbidden') ||
    message.toLowerCase().includes('403') ||
    message.toLowerCase().includes('unauthorized')
      ? 'You do not have permission. Please contact your administrator.'
      : message;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Lock Icon Circle */}
        <View style={styles.iconCircle}>
          <Image
            source={Images.lock}
            style={styles.lockIcon}
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>{title}</Text>

        {/* Message */}
        <Text style={styles.message}>{displayMessage}</Text>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          {onRetry && (
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={onRetry}
              activeOpacity={0.8}
            >
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          )}

          {onGoBack && (
            <TouchableOpacity
              style={styles.goBackBtn}
              onPress={onGoBack}
              activeOpacity={0.8}
            >
              <Text style={styles.goBackBtnText}>Go Back</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.white,
    borderRadius: borderRadius.cardRadius || 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF2F2',
    borderWidth: 2,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  lockIcon: {
    width: 28,
    height: 28,
    tintColor: '#DC2626',
  },
  title: {
    fontSize: 18,
    fontFamily: fontFamily.bold,
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  retryBtnText: {
    color: colors.white,
    fontSize: 13,
    fontFamily: fontFamily.bold,
  },
  goBackBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
  },
  goBackBtnText: {
    color: '#475569',
    fontSize: 13,
    fontFamily: fontFamily.medium,
  },
});

export default AccessDenied;
