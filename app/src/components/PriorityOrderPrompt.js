import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatCoins } from '../utils/formatters';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';
const OFFER_SECONDS = 8;

export function PriorityOrderPrompt({ offer, menuItems, queuePressure, topOffset = 6, onAccept }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(-8)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const animation = useRef(null);

  useEffect(() => {
    if (!offer) return undefined;
    translateY.setValue(-8);
    opacity.setValue(0);
    animation.current?.stop();
    animation.current = Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: 170, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(opacity, { toValue: 1, duration: 140, useNativeDriver: USE_NATIVE_DRIVER }),
    ]);
    animation.current.start();
    const pulseLoop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.025, duration: 360, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(pulse, { toValue: 1, duration: 360, useNativeDriver: USE_NATIVE_DRIVER }),
    ]));
    pulseLoop.start();
    return () => { animation.current?.stop(); pulseLoop.stop(); };
  }, [offer?.id, opacity, pulse, translateY]);

  if (!offer) return null;
  const item = menuItems.find((entry) => entry.id === offer.itemId);
  const risky = queuePressure >= 0.7;
  const critical = queuePressure >= 0.9;
  const progress = Math.max(0, Math.min(1, offer.remaining / OFFER_SECONDS));
  const estimatedPayout = Math.round((item?.price || 0) * (offer.spendMultiplier || 1));

  return (
    <Animated.View style={[styles.card, risky && styles.cardRisky, critical && styles.cardCritical, { top: topOffset, opacity, transform: [{ translateY }, { scale: pulse }] }]}>
      <View style={styles.headerRow}>
        <View style={styles.expressBadge}><Text style={styles.expressBadgeText}>EXPRESS</Text></View>
        <Text style={styles.timer}>{Math.ceil(offer.remaining)}s</Text>
      </View>
      <View style={styles.mainRow}>
        <View style={styles.customerBadge}><Text style={styles.customerEmoji}>{offer.customerEmoji || '⚡'}</Text></View>
        <View style={styles.copyColumn}>
          <Text numberOfLines={1} style={styles.title}>{item?.name || 'Priority Chai'}</Text>
          <Text style={styles.reward}>EST. {formatCoins(estimatedPayout)} · +12 HEAT</Text>
          <Text style={[styles.risk, risky && styles.riskHot]}>{critical ? 'CRITICAL QUEUE · high-risk accept' : risky ? 'QUEUE HOT · this order jumps ahead of regulars' : 'SAFE WINDOW · premium ticket jumps the line'}</Text>
        </View>
        <TouchableOpacity style={[styles.button, risky && styles.buttonRisky]} onPress={onAccept} accessibilityRole="button" accessibilityLabel={`Accept express priority order for ${item?.name || 'chai'}, ${Math.ceil(offer.remaining)} seconds remaining`}>
          <Text style={styles.buttonTop}>TAKE</Text><Text style={styles.buttonText}>ORDER</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.timerTrack}><View style={[styles.timerFill, risky && styles.timerFillRisky, { width: `${progress * 100}%` }]} /></View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { position: 'absolute', left: 8, right: 8, zIndex: 18, padding: 7, backgroundColor: '#3D240F', borderWidth: 3, borderColor: '#F6B93B', shadowColor: '#000', shadowOpacity: 0.55, shadowRadius: 0, shadowOffset: { width: 3, height: 3 }, elevation: 9 },
  cardRisky: { backgroundColor: '#5B2812', borderColor: '#E97928' }, cardCritical: { backgroundColor: '#6C2015', borderColor: '#FF9E43' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }, expressBadge: { backgroundColor: '#F6B93B', borderWidth: 2, borderColor: '#7A481E', paddingHorizontal: 6, paddingVertical: 2 }, expressBadgeText: { color: '#2E1B0D', fontSize: 7, fontWeight: '900', letterSpacing: 1 }, timer: { color: '#FFF0BF', fontSize: 10, fontWeight: '900' },
  mainRow: { flexDirection: 'row', alignItems: 'center', gap: 7 }, customerBadge: { width: 36, height: 36, backgroundColor: '#26150B', borderWidth: 2, borderColor: '#A76322', alignItems: 'center', justifyContent: 'center' }, customerEmoji: { fontSize: 18 }, copyColumn: { flex: 1, minWidth: 0 }, title: { color: '#FFF4CF', fontSize: 11, fontWeight: '900' }, reward: { color: '#F6B93B', fontSize: 7.5, fontWeight: '900', marginTop: 2 }, risk: { color: '#BFE07C', fontSize: 6.8, fontWeight: '800', marginTop: 2 }, riskHot: { color: '#FFD09B' },
  button: { minWidth: 52, backgroundColor: '#5F9D22', borderWidth: 3, borderColor: '#315912', paddingVertical: 6, alignItems: 'center' }, buttonRisky: { backgroundColor: '#D95F17', borderColor: '#7E2E0C' }, buttonTop: { color: '#FFF4CB', fontSize: 6.5, fontWeight: '900' }, buttonText: { color: '#FFF4CB', fontSize: 8, fontWeight: '900' }, timerTrack: { height: 6, marginTop: 6, backgroundColor: '#24150B', borderWidth: 1, borderColor: '#120A05' }, timerFill: { height: '100%', backgroundColor: '#8EC43F' }, timerFillRisky: { backgroundColor: '#F6B93B' },
});
