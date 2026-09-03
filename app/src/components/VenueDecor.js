import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function VenueDecor({ tier }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {tier >= 2 ? (
        <View style={styles.snackBoard}>
          <Text style={styles.snackText}>CHAI · SNACKS</Text>
        </View>
      ) : null}

      {tier >= 3 ? (
        <>
          <View style={styles.bench} />
          <View style={styles.displayCase}>
            <Text style={styles.displayText}>▦ ▦ ▦</Text>
          </View>
        </>
      ) : null}

      {tier >= 4 ? (
        <View style={styles.lightLine}>
          {Array.from({ length: 7 }).map((_, index) => (
            <View key={index} style={styles.lightBulb} />
          ))}
        </View>
      ) : null}

      {tier >= 5 ? (
        <View style={styles.flagshipBanner}>
          <Text style={styles.flagshipText}>NEIGHBORHOOD FLAGSHIP</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  snackBoard: {
    position: 'absolute',
    top: 80,
    right: 10,
    backgroundColor: '#6B3814',
    borderWidth: 3,
    borderColor: '#F6B93B',
    paddingHorizontal: 7,
    paddingVertical: 4,
    transform: [{ rotate: '2deg' }],
  },
  snackText: { color: '#F7E1A6', fontSize: 7, fontWeight: '900' },
  bench: {
    position: 'absolute',
    left: 8,
    bottom: 96,
    width: 72,
    height: 12,
    backgroundColor: '#805020',
    borderWidth: 3,
    borderColor: '#3B210E',
  },
  displayCase: {
    position: 'absolute',
    right: 12,
    bottom: 104,
    width: 68,
    height: 30,
    backgroundColor: '#C9E4DF',
    borderWidth: 3,
    borderColor: '#5B4B36',
    alignItems: 'center',
    justifyContent: 'center',
  },
  displayText: { color: '#A96221', fontSize: 12, fontWeight: '900' },
  lightLine: {
    position: 'absolute',
    top: 93,
    left: '18%',
    right: '18%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 2,
    borderColor: '#403016',
  },
  lightBulb: {
    width: 7,
    height: 7,
    marginTop: -2,
    backgroundColor: '#FFD45B',
    borderWidth: 1,
    borderColor: '#A5681F',
  },
  flagshipBanner: {
    position: 'absolute',
    left: '25%',
    right: '25%',
    top: 62,
    alignItems: 'center',
    backgroundColor: '#D95F17',
    borderWidth: 3,
    borderColor: '#7E2E0C',
    paddingVertical: 4,
  },
  flagshipText: { color: '#FFF0BF', fontSize: 7, fontWeight: '900', letterSpacing: 0.7 },
});
