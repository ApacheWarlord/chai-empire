import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { formatCoins } from '../utils/formatters';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

const getUpgradeScore = (state) =>
  Object.values(state.levels || {}).reduce((sum, value) => sum + value, 0) +
  (state.unlockedMenu?.length || 0) +
  (state.staffOwned?.length || 0);

export function GameFeedback({ state }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;
  const prevServed = useRef(state.totalServed);
  const prevLifetimeCoins = useRef(state.lifetimeCoins);
  const prevVenueTier = useRef(state.venueTier);
  const prevUpgradeScore = useRef(getUpgradeScore(state));
  const [message, setMessage] = useState('');
  const animation = useRef(null);

  const upgradeScore = useMemo(() => getUpgradeScore(state), [state.levels, state.staffOwned, state.unlockedMenu]);

  const showMessage = (nextMessage) => {
    animation.current?.stop();
    setMessage(nextMessage);
    opacity.setValue(0);
    translateY.setValue(8);
    animation.current = Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 120, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(translateY, { toValue: 0, duration: 160, useNativeDriver: USE_NATIVE_DRIVER }),
      ]),
      Animated.delay(650),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(translateY, { toValue: -8, duration: 220, useNativeDriver: USE_NATIVE_DRIVER }),
      ]),
    ]);
    animation.current.start();
  };

  useEffect(() => {
    const servedDelta = state.totalServed - prevServed.current;
    const coinDelta = state.lifetimeCoins - prevLifetimeCoins.current;

    if (state.venueTier > prevVenueTier.current) {
      showMessage(`NEW VENUE · TIER ${state.venueTier}`);
    } else if (upgradeScore > prevUpgradeScore.current) {
      showMessage('UPGRADE INSTALLED');
    } else if (servedDelta > 0 && coinDelta > 0) {
      showMessage(`+${formatCoins(coinDelta)} · ${servedDelta > 1 ? `${servedDelta} ORDERS` : 'ORDER SERVED'}`);
    } else if (coinDelta > 0) {
      showMessage(`+${formatCoins(coinDelta)} · REWARD`);
    }

    prevServed.current = state.totalServed;
    prevLifetimeCoins.current = state.lifetimeCoins;
    prevVenueTier.current = state.venueTier;
    prevUpgradeScore.current = upgradeScore;
  }, [state.totalServed, state.lifetimeCoins, state.venueTier, upgradeScore]);

  useEffect(() => () => animation.current?.stop(), []);

  if (!message) return null;

  return (
    <View pointerEvents="none" style={styles.layer}>
      <Animated.View style={[styles.toast, { opacity, transform: [{ translateY }] }]}>
        <Text style={styles.toastText}>{message}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 40,
  },
  toast: {
    backgroundColor: '#2D4D16',
    borderWidth: 3,
    borderColor: '#8EC43F',
    paddingHorizontal: 12,
    paddingVertical: 7,
    shadowColor: '#000',
    shadowOpacity: 0.55,
    shadowRadius: 0,
    shadowOffset: { width: 3, height: 3 },
    elevation: 8,
  },
  toastText: {
    color: '#FFF0BF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
});
