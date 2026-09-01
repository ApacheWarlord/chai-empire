import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatCoins } from '../utils/formatters';

const AD_SECONDS = 3;

export function RewardedAdModal({ reward, onResolve }) {
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    setCountdown(null);
  }, [reward?.id]);

  useEffect(() => {
    if (countdown == null || countdown <= 0) return undefined;
    const timer = setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  if (!reward) return null;
  const watching = countdown != null;
  const complete = countdown === 0;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={() => {}}>
      <View style={styles.backdrop}>
        <View style={styles.frame}>
          <Text style={styles.prototype}>PROTOTYPE REWARDED AD · NO NETWORK</Text>
          <Text style={styles.cup}>▥ ☕ ▥</Text>
          <Text style={styles.title}>{watching ? complete ? 'AD COMPLETE!' : 'A WORD FROM THE CHAI WALLAH' : 'DOUBLE THIS REWARD?'}</Text>
          <Text style={styles.reward}>{formatCoins(reward.amount)} → {formatCoins(reward.amount * 2)}</Text>
          {watching ? (
            <View style={styles.adStage}>
              <Text style={styles.adCopy}>HOT CHAI. QUICK BREAK. BIG DREAMS.</Text>
              <Text style={styles.countdown}>{complete ? '✓' : countdown}</Text>
              <TouchableOpacity disabled={!complete} style={[styles.doubleButton, !complete && styles.disabled]} onPress={() => onResolve(reward.id, 2)}>
                <Text style={styles.buttonText}>{complete ? `COLLECT ${formatCoins(reward.amount * 2)}` : 'WATCHING...'}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TouchableOpacity style={styles.doubleButton} onPress={() => setCountdown(AD_SECONDS)}>
                <Text style={styles.buttonText}>▶ WATCH MOCK AD · 3s</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.normalButton} onPress={() => onResolve(reward.id, 1)}>
                <Text style={styles.normalText}>COLLECT {formatCoins(reward.amount)}</Text>
              </TouchableOpacity>
            </>
          )}
          <Text style={styles.note}>Deterministic prototype flow. No ad SDK, tracking, or internet connection.</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(20,10,4,0.88)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  frame: { width: '100%', maxWidth: 380, backgroundColor: '#F2D99D', borderWidth: 5, borderColor: '#F6B93B', padding: 16, alignItems: 'center' },
  prototype: { color: '#8C3214', fontSize: 9, fontWeight: '900', letterSpacing: 1, textAlign: 'center' },
  cup: { fontSize: 38, marginVertical: 12 },
  title: { color: '#2E1B0D', fontSize: 16, fontWeight: '900', textAlign: 'center' },
  reward: { color: '#397619', fontSize: 22, fontWeight: '900', marginVertical: 10 },
  adStage: { width: '100%', alignItems: 'center' },
  adCopy: { color: '#6B3814', fontSize: 10, fontWeight: '900', marginBottom: 8 },
  countdown: { color: '#D95F17', fontSize: 48, fontWeight: '900', minHeight: 60 },
  doubleButton: { width: '100%', backgroundColor: '#5F9D22', borderWidth: 4, borderColor: '#315912', padding: 12, alignItems: 'center' },
  normalButton: { width: '100%', padding: 12, alignItems: 'center' },
  disabled: { opacity: 0.5 },
  buttonText: { color: '#FFF7DD', fontWeight: '900', fontSize: 12 },
  normalText: { color: '#5A431F', fontWeight: '900', fontSize: 10 },
  note: { color: '#765D39', fontSize: 8, textAlign: 'center', marginTop: 10 },
});
