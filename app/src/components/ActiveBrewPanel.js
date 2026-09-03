import React, { useEffect, useRef } from 'react';
import { Animated, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';
const brewKettleArt = require('../../assets/artwork/active-brew-kettle.png');

export function ActiveBrewPanel({ offer, brew, item, onStart, onTap }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.04, duration: 360, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(pulse, { toValue: 1, duration: 360, useNativeDriver: USE_NATIVE_DRIVER }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  if (!offer && !brew) return null;

  if (offer) {
    return (
      <Animated.View style={[styles.panel, { transform: [{ scale: pulse }] }]} accessibilityLiveRegion="polite">
        <Image source={brewKettleArt} style={styles.art} resizeMode="contain" accessibilityIgnoresInvertColors />
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>★ ACTIVE BREW · {Math.ceil(offer.remaining)}s</Text>
          <Text numberOfLines={1} style={styles.title}>{item?.name?.toUpperCase() || 'CHAI'} TICKET</Text>
          <Text style={styles.hint}>Optional · auto-service keeps running</Text>
        </View>
        <TouchableOpacity style={styles.startButton} onPress={onStart} accessibilityRole="button" accessibilityLabel={`Start active brew for ${item?.name || 'chai'}`}>
          <Text style={styles.startText}>BREW!</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  const stage = brew.stages[brew.stageIndex];
  const progress = Math.max(0, Math.min(1, brew.stageRemaining / brew.stageDuration));
  return (
    <View style={[styles.panel, styles.livePanel]} accessibilityLiveRegion="assertive">
      <Image source={brewKettleArt} style={styles.art} resizeMode="contain" accessibilityIgnoresInvertColors />
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>{item?.orderBubble || '☕'} {item?.name?.toUpperCase()} · {brew.stageIndex + 1}/{brew.stages.length}</Text>
        <Text style={styles.title}>{stage}</Text>
        <View style={styles.meter}>
          <View style={styles.goodZone} />
          <View style={styles.perfectZone} />
          <View style={[styles.marker, { left: `${progress * 94}%` }]} />
        </View>
        <Text style={styles.hint}>{brew.grades.map((grade) => grade === 'perfect' ? '★' : grade === 'good' ? '●' : '×').join(' ')} TAP IN GOLD</Text>
      </View>
      <TouchableOpacity style={styles.tapButton} onPress={onTap} accessibilityRole="button" accessibilityLabel={`${stage}, tap in the gold timing zone`}>
        <Text style={styles.tapText}>TAP</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { position: 'absolute', zIndex: 28, top: 150, left: '16%', right: '16%', minHeight: 74, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#3A210E', borderWidth: 3, borderColor: '#F6B93B', padding: 7, shadowColor: '#000', shadowOpacity: 0.65, shadowRadius: 0, shadowOffset: { width: 3, height: 3 }, elevation: 9 },
  livePanel: { backgroundColor: '#513013', borderColor: '#8EC43F' },
  art: { width: 42, height: 48 },
  copy: { flex: 1, gap: 2 },
  eyebrow: { color: '#F6B93B', fontSize: 7.5, fontWeight: '900', letterSpacing: 0.5 },
  title: { color: '#FFF3C8', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  hint: { color: '#D6C08E', fontSize: 7, fontWeight: '800' },
  startButton: { minWidth: 72, minHeight: 50, alignItems: 'center', justifyContent: 'center', backgroundColor: '#5F9D22', borderWidth: 3, borderColor: '#315912' },
  startText: { color: '#FFF7DD', fontWeight: '900', fontSize: 13 },
  tapButton: { minWidth: 72, minHeight: 56, alignItems: 'center', justifyContent: 'center', backgroundColor: '#D95F17', borderWidth: 3, borderColor: '#7E2E0C' },
  tapText: { color: '#FFF7DD', fontWeight: '900', fontSize: 18 },
  meter: { position: 'relative', height: 11, backgroundColor: '#6B2818', borderWidth: 2, borderColor: '#1A0D05', overflow: 'hidden' },
  goodZone: { position: 'absolute', left: '16%', right: '10%', top: 0, bottom: 0, backgroundColor: '#5F9D22' },
  perfectZone: { position: 'absolute', left: '36%', width: '34%', top: 0, bottom: 0, backgroundColor: '#F6B93B' },
  marker: { position: 'absolute', width: 5, top: -1, bottom: -1, backgroundColor: '#FFF7DD' },
});
