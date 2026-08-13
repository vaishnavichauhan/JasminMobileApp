import React, { useEffect, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Animated,
  StatusBar,
  Dimensions,
} from 'react-native';
import { colors } from '../../../styles/variables';
import Images from '../../../assets/images';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const storeOpacity = useRef(new Animated.Value(0)).current;
  const storeScale   = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    Animated.sequence([
      // Fade-in + scale up the store image
      Animated.parallel([
        Animated.timing(storeOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.spring(storeScale, {
          toValue: 1,
          friction: 6,
          tension: 50,
          useNativeDriver: true,
        }),
      ]),
      // Hold for 1.8 seconds
      Animated.delay(1800),
    ]).start(() => {
      onFinish();
    });
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Decorative background circles */}
      <View style={styles.circleTopRight} />
      <View style={styles.circleBottomLeft} />

      {/* Jasmin Mobile Store Image — centered, full focus */}
      <Animated.View
        style={[
          styles.storeWrap,
          {
            opacity: storeOpacity,
            transform: [{ scale: storeScale }],
          },
        ]}
      >
        <Image
          source={Images.jasminHouse}
          style={styles.storeImage}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  circleTopRight: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  circleBottomLeft: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  storeWrap: {
    width: width * 0.88,
    height: height * 0.45,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  storeImage: {
    width: '100%',
    height: '100%',
  },
});

export default SplashScreen;
