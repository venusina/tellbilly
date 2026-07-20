import { Image } from 'expo-image';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import classes from './animated-icon.module.css';

const DURATION = 300;
const GLOW_ROTATION_DURATION = 60 * 1000 * 4;

export function AnimatedSplashOverlay() {
  return null;
}

export function AnimatedIcon() {
  const backgroundScale = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(1.2)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const glowRotation = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0.8)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(backgroundScale, {
      toValue: 1,
      duration: DURATION * 0.6,
      easing: Easing.elastic(1.2),
      useNativeDriver: true,
    }).start();

    Animated.sequence([
      Animated.delay(DURATION * 0.6),
      Animated.parallel([
        Animated.timing(logoScale, { toValue: 1, duration: DURATION * 0.4, easing: Easing.elastic(1.2), useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: DURATION * 0.4, easing: Easing.elastic(1.2), useNativeDriver: true }),
      ]),
    ]).start();

    Animated.parallel([
      Animated.timing(glowScale, { toValue: 1, duration: DURATION, easing: Easing.elastic(0.7), useNativeDriver: true }),
      Animated.timing(glowOpacity, { toValue: 1, duration: DURATION, easing: Easing.elastic(0.7), useNativeDriver: true }),
      Animated.timing(glowRotation, { toValue: 1, duration: GLOW_ROTATION_DURATION, easing: Easing.linear, useNativeDriver: true }),
    ]).start();
  }, [backgroundScale, logoScale, logoOpacity, glowRotation, glowScale, glowOpacity]);

  const glowSpin = glowRotation.interpolate({ inputRange: [0, 1], outputRange: ['-180deg', '7020deg'] });

  return (
    <View style={styles.iconContainer}>
      <Animated.View
        style={[styles.glow, { opacity: glowOpacity, transform: [{ rotateZ: glowSpin }, { scale: glowScale }] }]}>
        <Image style={styles.glow} source={require('@/assets/images/logo-glow.png')} />
      </Animated.View>

      <Animated.View style={[styles.background, { transform: [{ scale: backgroundScale }] }]}>
        <div className={classes.expoLogoBackground} />
      </Animated.View>

      <Animated.View style={[styles.imageContainer, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <Image style={styles.image} source={require('@/assets/images/expo-logo.png')} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
    zIndex: 1000,
    position: 'absolute',
    top: 128 / 2 + 138,
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    width: 201,
    height: 201,
    position: 'absolute',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 128,
    height: 128,
  },
  image: {
    position: 'absolute',
    width: 76,
    height: 71,
  },
  background: {
    width: 128,
    height: 128,
    position: 'absolute',
  },
});
