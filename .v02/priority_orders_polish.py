from pathlib import Path

ROOT = Path('.')

def patch(path, old, new, count=1):
    file_path = ROOT / path
    text = file_path.read_text()
    if old not in text:
        raise SystemExit(f"Missing polish context in {path}: {old[:140]!r}")
    file_path.write_text(text.replace(old, new, count))

Path('app/src/components/PriorityOrderPrompt.js').write_text("""import React, { useEffect, useRef } from 'react';
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
""")

patch('app/App.js', "<View style={styles.sceneFrame}>", "<View style={[styles.sceneFrame, state.kettleBoostRemaining > 0 && styles.sceneFrameBoost]}>")
patch('app/App.js', "<View style={styles.kettleStation}>", "<View style={[styles.kettleStation, state.kettleBoostRemaining > 0 && styles.kettleStationBoost]}>")
patch('app/App.js', """            <PriorityOrderPrompt
              offer={state.priorityOffer}
              menuItems={menuItems}
              queuePressure={queuePressure}
              topOffset={state.activeEvent ? 34 : 6}
              onAccept={acceptPriority}
            />

            <View style={styles.stallRoof}>""", """            <PriorityOrderPrompt
              offer={state.priorityOffer}
              menuItems={menuItems}
              queuePressure={queuePressure}
              topOffset={state.activeEvent ? 34 : 6}
              onAccept={acceptPriority}
            />

            {state.serviceStreak >= 3 ? (
              <View style={styles.streakChip}>
                <Text style={styles.streakChipText}>🔥 {state.serviceStreak} STREAK</Text>
              </View>
            ) : null}

            <View style={styles.stallRoof}>""")
patch('app/App.js', """                    <View style={styles.orderBubble}>
                      <Text style={styles.orderBubbleText}>{item?.orderBubble || '☕'}</Text>
                    </View>""", """                    <View style={[styles.orderBubble, customer.priorityOrder && styles.orderBubblePriority]}>
                      <Text style={styles.orderBubbleText}>{customer.priorityOrder ? `⚡ ${item?.orderBubble || '☕'}` : item?.orderBubble || '☕'}</Text>
                    </View>""")
patch('app/App.js', "<View style={styles.centerBadge}>", "<View style={[styles.centerBadge, state.kettleBoostRemaining > 0 && styles.centerBadgeBoost]}>")
patch('app/App.js', "  sceneFrame: { borderWidth: 4, borderColor: C.wood2, backgroundColor: C.dark, ...pixelShadow },", "  sceneFrame: { borderWidth: 4, borderColor: C.wood2, backgroundColor: C.dark, ...pixelShadow },\n  sceneFrameBoost: { borderColor: C.gold, shadowOpacity: 0.95, elevation: 10 },")
patch('app/App.js', "  kettleStation: { alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 10 },", "  kettleStation: { alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 10 },\n  kettleStationBoost: { backgroundColor: '#5E2B12', borderWidth: 2, borderColor: C.orange, paddingHorizontal: 8, paddingTop: 3 },")
patch('app/App.js', "  orderBubble: { minWidth: 28, height: 24, backgroundColor: '#FFF0BF', borderWidth: 2, borderColor: '#6F431C', alignItems: 'center', justifyContent: 'center', marginBottom: -2, zIndex: 3 },", "  orderBubble: { minWidth: 28, height: 24, backgroundColor: '#FFF0BF', borderWidth: 2, borderColor: '#6F431C', alignItems: 'center', justifyContent: 'center', marginBottom: -2, zIndex: 3 },\n  orderBubblePriority: { minWidth: 40, backgroundColor: '#FFE08A', borderColor: C.orange },")
patch('app/App.js', "  emptyQueueText: { color: '#EED9AC', fontSize: 9, fontWeight: '900' },", "  emptyQueueText: { color: '#EED9AC', fontSize: 9, fontWeight: '900' },\n  streakChip: { position: 'absolute', right: 8, bottom: 102, zIndex: 12, backgroundColor: '#512611', borderWidth: 2, borderColor: C.orange, paddingHorizontal: 7, paddingVertical: 4 },\n  streakChipText: { color: '#FFF0BF', fontSize: 8, fontWeight: '900' },")
patch('app/App.js', "  centerBadge: { flex: 1.35, backgroundColor: C.orange, borderWidth: 3, borderColor: '#7E2E0C', alignItems: 'center', justifyContent: 'center' },", "  centerBadge: { flex: 1.35, backgroundColor: C.orange, borderWidth: 3, borderColor: '#7E2E0C', alignItems: 'center', justifyContent: 'center' },\n  centerBadgeBoost: { backgroundColor: '#8C3214', borderColor: C.gold },")

patch('app/src/components/GameDrawer.js', """      <View style={styles.card}>
        <Text style={styles.sectionLabel}>STALL OPERATIONS</Text>""", """      <View style={[styles.expressStrip, state.priorityOffer && styles.expressStripLive]}>
        <View>
          <Text style={styles.expressTitle}>⚡ EXPRESS DESK</Text>
          <Text style={styles.expressSub}>{state.priorityOffer ? `${Math.ceil(state.priorityOffer.remaining)}s LIVE · DECIDE NOW` : `NEXT WINDOW ~${Math.ceil(state.priorityOfferCooldown || 0)}s`}</Text>
        </View>
        <Text style={styles.expressScore}>{state.priorityOrdersCompleted || 0} SERVED · {state.priorityOrdersMissed || 0} MISSED</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>STALL OPERATIONS</Text>""")
patch('app/src/components/GameDrawer.js', """        <Metric label="MOOD" value={formatPercent(state.satisfaction)} />
        <Metric label="AVG TICKET" value={formatCoins(stats.averagePayout)} />""", """        <Metric label="MOOD" value={formatPercent(state.satisfaction)} />
        <Metric label="AVG TICKET" value={formatCoins(stats.averagePayout)} />
        <Metric label="EXPRESS TAKEN" value={state.priorityOrdersAccepted || 0} />
        <Metric label="EXPRESS SERVED" value={state.priorityOrdersCompleted || 0} />""")
patch('app/src/components/GameDrawer.js', "  boostButtonText: { color: '#FFF3CD', fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },", "  boostButtonText: { color: '#FFF3CD', fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },\n  expressStrip: { backgroundColor: '#3A210F', borderWidth: 3, borderColor: '#8A5522', padding: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },\n  expressStripLive: { backgroundColor: '#5A2A12', borderColor: C.gold },\n  expressTitle: { color: C.gold, fontSize: 8.5, fontWeight: '900' },\n  expressSub: { color: '#D7B77F', fontSize: 7, fontWeight: '800', marginTop: 2 },\n  expressScore: { color: '#FFF0BF', fontSize: 7, fontWeight: '900', textAlign: 'right' },")

patch('app/src/components/GameFeedback.js', """  const prevKettleBoostUses = useRef(state.kettleBoostUses || 0);
  const [feedback, setFeedback]""", """  const prevKettleBoostUses = useRef(state.kettleBoostUses || 0);
  const prevPriorityOfferId = useRef(state.priorityOffer?.id || null);
  const prevPriorityAccepted = useRef(state.priorityOrdersAccepted || 0);
  const prevPriorityCompleted = useRef(state.priorityOrdersCompleted || 0);
  const prevPriorityMissed = useRef(state.priorityOrdersMissed || 0);
  const [feedback, setFeedback]""")
patch('app/src/components/GameFeedback.js', """    const kettleBoostUses = state.kettleBoostUses || 0;

    if (kettleBoostUses > prevKettleBoostUses.current) {
      showMessage(`⚡ KETTLE BOOST · ${Math.ceil(state.kettleBoostRemaining || 0)}s`, 'hot');
    } else if (state.venueTier > prevVenueTier.current) {""", """    const kettleBoostUses = state.kettleBoostUses || 0;
    const priorityOfferId = state.priorityOffer?.id || null;
    const priorityAccepted = state.priorityOrdersAccepted || 0;
    const priorityCompleted = state.priorityOrdersCompleted || 0;
    const priorityMissed = state.priorityOrdersMissed || 0;

    if (priorityCompleted > prevPriorityCompleted.current) {
      showMessage(`★ EXPRESS SERVED · +${formatCoins(Math.max(0, coinDelta))}`, 'gold');
    } else if (priorityAccepted > prevPriorityAccepted.current) {
      showMessage('⚡ EXPRESS TICKET LOCKED', 'event');
    } else if (priorityOfferId && priorityOfferId !== prevPriorityOfferId.current) {
      showMessage(`⚡ PRIORITY ORDER · ${Math.ceil(state.priorityOffer.remaining)}s`, 'event');
    } else if (priorityMissed > prevPriorityMissed.current) {
      showMessage('EXPRESS WINDOW MISSED', 'hot');
    } else if (kettleBoostUses > prevKettleBoostUses.current) {
      showMessage(`⚡ KETTLE BOOST · ${Math.ceil(state.kettleBoostRemaining || 0)}s`, 'hot');
    } else if (state.venueTier > prevVenueTier.current) {""")
patch('app/src/components/GameFeedback.js', """    prevBestStreak.current = bestStreak;
    prevKettleBoostUses.current = kettleBoostUses;
  }, [""", """    prevBestStreak.current = bestStreak;
    prevKettleBoostUses.current = kettleBoostUses;
    prevPriorityOfferId.current = priorityOfferId;
    prevPriorityAccepted.current = priorityAccepted;
    prevPriorityCompleted.current = priorityCompleted;
    prevPriorityMissed.current = priorityMissed;
  }, [""")
patch('app/src/components/GameFeedback.js', """    state.kettleBoostRemaining,
    upgradeScore,""", """    state.kettleBoostRemaining,
    state.priorityOffer,
    state.priorityOrdersAccepted,
    state.priorityOrdersCompleted,
    state.priorityOrdersMissed,
    upgradeScore,""")

with open('app/tests/stabilization.test.js', 'a') as f:
    f.write("""

test('accepted Priority Order keeps its express flag when assigned to a worker', () => {
  const state = createInitialState();
  state.eventCooldown = 999;
  state.priorityOfferCooldown = 999;
  state.priorityOffer = { id: 'handoff-offer', itemId: 'basic-chai', remaining: 6, customerTypeId: 'student', customerEmoji: '🎒', customerName: 'Student', spendMultiplier: 2.2 };
  const accepted = acceptPriorityOrder(state);
  const next = simulateTicks(accepted, 1);
  assert.equal(next.activeOrders.length, 1);
  assert.equal(next.activeOrders[0].priorityOrder, true);
  assert.equal(next.activeOrders[0].spendMultiplier, 2.2);
});
""")
