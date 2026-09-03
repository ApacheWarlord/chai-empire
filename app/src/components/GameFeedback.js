import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { formatCoins } from '../utils/formatters';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

const getUpgradeScore = (state) =>
  Object.values(state.levels || {}).reduce((sum, value) => sum + value, 0) +
  (state.unlockedMenu?.length || 0) +
  (state.staffOwned?.length || 0);

const getRushTier = (heat) => {
  if (heat >= 85) return { id: 'peak', label: 'PEAK RUSH', hot: true };
  if (heat >= 55) return { id: 'hot', label: 'HOT STREAK', hot: true };
  if (heat >= 25) return { id: 'warm', label: 'WARM FLOW', hot: false };
  return { id: 'steady', label: 'STEADY SERVICE', hot: false };
};

export function GameFeedback({ state }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;
  const prevServed = useRef(state.totalServed);
  const prevLifetimeCoins = useRef(state.lifetimeCoins);
  const prevVenueTier = useRef(state.venueTier);
  const prevUpgradeScore = useRef(getUpgradeScore(state));
  const prevRushTier = useRef(getRushTier(state.heatMeter || 0).id);
  const prevEventId = useRef(state.activeEvent?.id || null);
  const prevBestStreak = useRef(state.bestServiceStreak || 0);
  const prevKettleBoostUses = useRef(state.kettleBoostUses || 0);
  const prevPriorityOfferId = useRef(state.priorityOffer?.id || null);
  const prevPriorityAccepted = useRef(state.priorityOrdersAccepted || 0);
  const prevPriorityCompleted = useRef(state.priorityOrdersCompleted || 0);
  const prevPriorityMissed = useRef(state.priorityOrdersMissed || 0);
  const prevThiefOutcomeSequence = useRef(state.lastThiefOutcome?.sequence || 0);
  const prevBrewOutcomeSequence = useRef(state.lastActiveBrewOutcome?.sequence || 0);
  const [feedback, setFeedback] = useState({ message: '', tone: 'good' });
  const animation = useRef(null);

  const upgradeScore = useMemo(() => getUpgradeScore(state), [state.levels, state.staffOwned, state.unlockedMenu]);
  const rushTier = useMemo(() => getRushTier(state.heatMeter || 0), [state.heatMeter]);

  const showMessage = (nextMessage, tone = 'good') => {
    animation.current?.stop();
    setFeedback({ message: nextMessage, tone });
    opacity.setValue(0);
    translateY.setValue(8);
    animation.current = Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 120, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(translateY, { toValue: 0, duration: 160, useNativeDriver: USE_NATIVE_DRIVER }),
      ]),
      Animated.delay(760),
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
    const activeEventId = state.activeEvent?.id || null;
    const bestStreak = state.bestServiceStreak || 0;
    const kettleBoostUses = state.kettleBoostUses || 0;
    const priorityOfferId = state.priorityOffer?.id || null;
    const priorityAccepted = state.priorityOrdersAccepted || 0;
    const priorityCompleted = state.priorityOrdersCompleted || 0;
    const priorityMissed = state.priorityOrdersMissed || 0;
    const thiefOutcomeSequence = state.lastThiefOutcome?.sequence || 0;
    const brewOutcomeSequence = state.lastActiveBrewOutcome?.sequence || 0;

    if (brewOutcomeSequence > prevBrewOutcomeSequence.current) {
      const outcome = state.lastActiveBrewOutcome;
      const label = outcome.grade === 'perfect' ? 'PERFECT CHAI!' : outcome.grade === 'good' ? 'GOOD POUR!' : 'SLOPPY SAVE';
      showMessage(`☕ ${label} · +${formatCoins(outcome.payout)} · +${outcome.heatBonus} HEAT`, outcome.grade === 'perfect' ? 'gold' : outcome.grade === 'sloppy' ? 'hot' : 'good');
    } else if (thiefOutcomeSequence > prevThiefOutcomeSequence.current) {
      if (state.lastThiefOutcome.type === 'shooed') {
        const grade = state.lastThiefOutcome.grade === 'perfect' ? 'PERFECT CATCH' : state.lastThiefOutcome.grade === 'quick' ? 'QUICK SAVE' : 'CLOSE CALL';
        showMessage(`💨 ${grade} · +${state.lastThiefOutcome.heatBonus} HEAT`, 'gold');
      } else {
        showMessage(`🥷 BISCUIT JAR RAID · -${state.lastThiefOutcome.amount}`, 'hot');
      }
    } else if (priorityCompleted > prevPriorityCompleted.current) {
      showMessage(`★ EXPRESS SERVED · +${formatCoins(Math.max(0, coinDelta))}`, 'gold');
    } else if (priorityAccepted > prevPriorityAccepted.current) {
      showMessage('⚡ EXPRESS TICKET LOCKED', 'event');
    } else if (priorityOfferId && priorityOfferId !== prevPriorityOfferId.current) {
      showMessage(`⚡ PRIORITY ORDER · ${Math.ceil(state.priorityOffer.remaining)}s`, 'event');
    } else if (priorityMissed > prevPriorityMissed.current) {
      showMessage('EXPRESS WINDOW MISSED', 'hot');
    } else if (kettleBoostUses > prevKettleBoostUses.current) {
      showMessage(`⚡ KETTLE BOOST · ${Math.ceil(state.kettleBoostRemaining || 0)}s`, 'hot');
    } else if (state.venueTier > prevVenueTier.current) {
      showMessage(`NEW VENUE · TIER ${state.venueTier}`, 'gold');
    } else if (upgradeScore > prevUpgradeScore.current) {
      showMessage('UPGRADE INSTALLED', 'gold');
    } else if (activeEventId && activeEventId !== prevEventId.current) {
      showMessage(`⚡ ${state.activeEvent.name.toUpperCase()}`, 'event');
    } else if (rushTier.id !== prevRushTier.current && rushTier.id !== 'steady') {
      showMessage(`RUSH UP · ${rushTier.label}`, rushTier.hot ? 'hot' : 'good');
    } else if (bestStreak > prevBestStreak.current && [5, 10, 20, 30, 50].includes(bestStreak)) {
      showMessage(`🔥 ${bestStreak} SERVICE STREAK`, bestStreak >= 20 ? 'hot' : 'good');
    } else if (servedDelta > 0 && coinDelta > 0) {
      showMessage(`+${formatCoins(coinDelta)} · ${servedDelta > 1 ? `${servedDelta} ORDERS` : 'ORDER SERVED'}`);
    } else if (coinDelta > 0) {
      showMessage(`+${formatCoins(coinDelta)} · REWARD`);
    }

    prevServed.current = state.totalServed;
    prevLifetimeCoins.current = state.lifetimeCoins;
    prevVenueTier.current = state.venueTier;
    prevUpgradeScore.current = upgradeScore;
    prevRushTier.current = rushTier.id;
    prevEventId.current = activeEventId;
    prevBestStreak.current = bestStreak;
    prevKettleBoostUses.current = kettleBoostUses;
    prevPriorityOfferId.current = priorityOfferId;
    prevPriorityAccepted.current = priorityAccepted;
    prevPriorityCompleted.current = priorityCompleted;
    prevPriorityMissed.current = priorityMissed;
    prevThiefOutcomeSequence.current = thiefOutcomeSequence;
    prevBrewOutcomeSequence.current = brewOutcomeSequence;
  }, [
    state.totalServed,
    state.lifetimeCoins,
    state.venueTier,
    state.activeEvent,
    state.bestServiceStreak,
    state.kettleBoostUses,
    state.kettleBoostRemaining,
    state.priorityOffer,
    state.priorityOrdersAccepted,
    state.priorityOrdersCompleted,
    state.priorityOrdersMissed,
    state.lastThiefOutcome,
    state.lastActiveBrewOutcome,
    upgradeScore,
    rushTier.id,
    rushTier.label,
    rushTier.hot,
  ]);

  useEffect(() => () => animation.current?.stop(), []);

  if (!feedback.message) return null;

  return (
    <View pointerEvents="none" style={styles.layer}>
      <Animated.View
        style={[
          styles.toast,
          feedback.tone === 'gold' && styles.toastGold,
          feedback.tone === 'hot' && styles.toastHot,
          feedback.tone === 'event' && styles.toastEvent,
          { opacity, transform: [{ translateY }] },
        ]}
      >
        <Text style={styles.toastText}>{feedback.message}</Text>
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
  toastGold: { backgroundColor: '#684718', borderColor: '#F6B93B' },
  toastHot: { backgroundColor: '#7A2D13', borderColor: '#E97928' },
  toastEvent: { backgroundColor: '#4C2B68', borderColor: '#C58AF2' },
  toastText: {
    color: '#FFF0BF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
});
