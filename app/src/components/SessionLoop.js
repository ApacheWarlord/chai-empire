import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatCoins } from '../utils/formatters';

export function SessionLoop({ run, choices, onChoose, onClaim }) {
  const complete = run.served >= run.target;
  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>ONE MORE MINUTE · TEA RUN {run.run}</Text>
          <Text style={styles.title}>{complete ? 'RUN COMPLETE — REWARD READY!' : `SERVE ${run.target - run.served} MORE GUEST${run.target - run.served === 1 ? '' : 'S'}`}</Text>
        </View>
        <TouchableOpacity disabled={!complete} onPress={onClaim} style={[styles.rewardButton, !complete && styles.disabled]}>
          <Text style={styles.rewardText}>{complete ? 'CLAIM' : `${formatCoins(run.reward)}`}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.min(100, run.served / run.target * 100)}%` }]} /></View>
      <Text style={styles.choiceTitle}>CALL THE NEXT MOVE</Text>
      <View style={styles.choiceRow}>
        {choices.map((choice) => {
          const disabled = !choice.ready || Boolean(choice.disabledReason);
          return (
            <TouchableOpacity key={choice.id} disabled={disabled} onPress={() => onChoose(choice.id)} style={[styles.choice, disabled && styles.disabled]}>
              <Text style={styles.choiceIcon}>{choice.icon}</Text>
              <Text style={styles.choiceLabel}>{choice.label.toUpperCase()}</Text>
              <Text numberOfLines={2} style={styles.choiceBlurb}>{choice.disabledReason || choice.blurb}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: '#2C190D', borderWidth: 4, borderColor: '#D95F17', padding: 8 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyebrow: { color: '#F6B93B', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  title: { color: '#FFF0BF', fontSize: 12, fontWeight: '900', marginTop: 3 },
  rewardButton: { minWidth: 64, backgroundColor: '#5F9D22', borderWidth: 3, borderColor: '#8EC43F', padding: 9, alignItems: 'center' },
  rewardText: { color: '#FFF7DD', fontSize: 10, fontWeight: '900' },
  progressTrack: { height: 10, backgroundColor: '#4B3728', borderWidth: 2, borderColor: '#140B05', marginVertical: 7 },
  progressFill: { height: '100%', backgroundColor: '#F6B93B' },
  choiceTitle: { color: '#C9A86D', fontSize: 8, fontWeight: '900', marginBottom: 5 },
  choiceRow: { flexDirection: 'row', gap: 5 },
  choice: { flex: 1, minHeight: 82, backgroundColor: '#6B3814', borderWidth: 3, borderColor: '#BB7126', padding: 5, alignItems: 'center' },
  choiceIcon: { fontSize: 18 },
  choiceLabel: { color: '#FFF0BF', fontSize: 8, fontWeight: '900', textAlign: 'center' },
  choiceBlurb: { color: '#E1C790', fontSize: 7, fontWeight: '700', textAlign: 'center', marginTop: 3 },
  disabled: { opacity: 0.46 },
});
