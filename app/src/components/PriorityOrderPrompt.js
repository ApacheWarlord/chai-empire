import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function PriorityOrderPrompt({ offer, menuItems, queuePressure, topOffset = 6, onAccept }) {
  if (!offer) return null;
  const item = menuItems.find((entry) => entry.id === offer.itemId);
  const risky = queuePressure >= 0.7;

  return (
    <View style={[styles.card, { top: topOffset }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.eyebrow}>⚡ PRIORITY ORDER · {Math.ceil(offer.remaining)}s</Text>
        <Text style={styles.title}>{offer.customerEmoji || '⚡'} {item?.name || 'Express Chai'}</Text>
        <Text style={styles.copy}>{risky ? 'QUEUE HOT · accepting this ticket may delay regulars' : 'JUMPS THE LINE · premium payout + bonus Heat'}</Text>
      </View>
      <TouchableOpacity style={[styles.button, risky && styles.buttonRisky]} onPress={onAccept} accessibilityRole="button" accessibilityLabel={`Accept priority order for ${item?.name || 'chai'}`}>
        <Text style={styles.buttonText}>ACCEPT</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { position: 'absolute', left: 8, right: 8, zIndex: 18, minHeight: 64, padding: 7, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#40200F', borderWidth: 3, borderColor: '#F6B93B' },
  eyebrow: { color: '#F6B93B', fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  title: { color: '#FFF0BF', fontSize: 11, fontWeight: '900', marginTop: 2 },
  copy: { color: '#DDBD83', fontSize: 7, fontWeight: '800', marginTop: 2 },
  button: { backgroundColor: '#5F9D22', borderWidth: 3, borderColor: '#315912', paddingVertical: 8, paddingHorizontal: 10 },
  buttonRisky: { backgroundColor: '#D95F17', borderColor: '#7E2E0C' },
  buttonText: { color: '#FFF4CB', fontSize: 8, fontWeight: '900' },
});
