import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { useAuth } from '../../context/AuthContext';
import { fontSize } from '../../styles/variables';

export const Watermark: React.FC = () => {
  const { user } = useAuth();
  const [deviceId, setDeviceId] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    const fetchDeviceId = async () => {
      try {
        const id = await DeviceInfo.getUniqueId();
        if (isMounted) {
          setDeviceId(id || `${Platform.OS}-device`);
        }
      } catch (error) {
        if (isMounted) {
          setDeviceId(`${Platform.OS}-device`);
        }
      }
    };
    fetchDeviceId();
    return () => {
      isMounted = false;
    };
  }, []);

  const username =
    user?.username ||
    user?.user_name ||
    user?.name ||
    user?.full_name ||
    user?.fullName ||
    user?.email ||
    'User';

  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  const currentDate = `${day}/${month}/${year}`;

  const watermarkText = `${username}-${currentDate}-${deviceId}`;

  return (
    <View style={styles.overlay} pointerEvents="none">
      {Array.from({ length: 10 }).map((_, index) => (
        <View key={index} style={styles.row}>
          <Text style={styles.text} numberOfLines={1}>
            {watermarkText}   {watermarkText}   {watermarkText}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 99999,
    elevation: 99999,
    opacity: 0.25,
    overflow: 'hidden',
  },
  row: {
    transform: [{ rotate: '-25deg' }],
    marginVertical: 14,
    width: '180%',
    alignItems: 'center',
  },
  text: {
    fontSize: fontSize.tooSmall,
    fontWeight: '600',
    color: '#EF4444',
    letterSpacing: 0.5,
  },
});

export default Watermark;
