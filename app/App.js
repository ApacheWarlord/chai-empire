import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';

const art = {
  sky: require('./assets/generated-png/bg-sky.png'),
  ground: require('./assets/generated-png/bg-ground.png'),
  stallBody: require('./assets/generated-png/stall-body.png'),
  stallWindow: require('./assets/generated-png/stall-window.png'),
  signBoard: require('./assets/generated-png/sign-board.png'),
  sun: require('./assets/generated-png/sun.png'),
  owner: require('./assets/generated-png/owner.png'),
  helper: require('./assets/generated-png/helper.png'),
  customer: require('./assets/generated-png/customer.png'),
  counter: require('./assets/generated-png/counter.png'),
  kettle: require('./assets/generated-png/kettle.png'),
};
import { StatusBar } from 'expo-status-bar';
import { useGameState } from './src/hooks/useGameState';
import { formatCoins, formatPercent } from './src/utils/formatters';
import { getTrackCost } from './src/game/simulation';

const tabs = ['speed', 'staff', 'quality', 'menu', 'venue'];

const getShortfallLabel = (current, cost) => {
  const remaining = Math.max(0, cost - current);
  return remaining > 0 ? `Need ${formatCoins(remaining)} more` : null;
};

export default function App() {
  const [activeTab, setActiveTab] = useState('speed');
  const [coinPops, setCoinPops] = useState([]);
  const [celebrationText, setCelebrationText] = useState('');
  const [upgradeFlash, setUpgradeFlash] = useState('');
  const {
    isLoaded,
    state,
    stats,
    venueProgress,
    recommendation,
    milestones,
    dailyObjectives,
    tutorialStep,
    bottleneck,
    offlineCoins,
    recoveryNotice,
    clearOfflineCoins,
    dismissRecoveryNotice,
    buyUpgrade,
    hireStaff,
    buyMenuUnlock,
    buyVenue,
    claimObjective,
    dismissTutorial,
    resetGame,
    upgradeTracks,
    staffUnlocks,
    menuItems,
  } = useGameState();
  const prevServedRef = useRef(0);
  const prevCoinsRef = useRef(0);
  const prevUpgradeCountRef = useRef(0);
  const prevVenueTierRef = useRef(1);

  const queuePreview = useMemo(
    () =>
      state.queue.slice(0, 4).map((customer) => ({
        ...customer,
        item: menuItems.find((entry) => entry.id === customer.itemId),
      })),
    [menuItems, state.queue]
  );

  const activeOrderPreview = useMemo(
    () =>
      state.activeOrders.slice(0, 3).map((order) => ({
        ...order,
        item: menuItems.find((entry) => entry.id === order.itemId),
      })),
    [menuItems, state.activeOrders]
  );

  const queuePressure = state.queue.length / Math.max(stats.queueCapacity, 1);
  const queuePressureLabel =
    queuePressure >= 0.85 ? 'Queue critical' : queuePressure >= 0.6 ? 'Queue building' : 'Queue stable';
  const activeEventTime = state.activeEvent ? `${state.activeEvent.remaining}s left` : 'No event live';
  const nextRushTarget = state.heatMeter >= 85 ? 100 : state.heatMeter >= 55 ? 85 : state.heatMeter >= 25 ? 55 : 25;
  const rushProgress = nextRushTarget > 0 ? state.heatMeter / nextRushTarget : 1;

  const tabCards = useMemo(() => {
    if (activeTab === 'speed' || activeTab === 'quality') {
      return upgradeTracks.filter((track) => track.tab === activeTab);
    }
    if (activeTab === 'staff') {
      return staffUnlocks;
    }
    if (activeTab === 'menu') {
      return menuItems;
    }
    return [];
  }, [activeTab, menuItems, staffUnlocks, upgradeTracks]);

  if (!isLoaded) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <StatusBar style="light" />
        <Text style={styles.loadingText}>Heating the kettle...</Text>
      </SafeAreaView>
    );
  }

  const nextVenue = venueProgress.next;
  const venueRequirements = nextVenue
    ? [
        state.coins < nextVenue.upgradeCost ? `Need ${formatCoins(nextVenue.upgradeCost - state.coins)}` : null,
        stats.businessLevel < nextVenue.businessLevelRequired ? `Business Lv.${nextVenue.businessLevelRequired}` : null,
        state.levels.reputation < nextVenue.reputationRequired ? `Reputation Lv.${nextVenue.reputationRequired}` : null,
      ].filter(Boolean)
    : [];

  useEffect(() => {
    const servedDelta = state.totalServed - prevServedRef.current;
    const coinsDelta = Math.max(0, state.lifetimeCoins - prevCoinsRef.current);
    if (servedDelta > 0 && coinsDelta > 0) {
      const id = Date.now();
      setCoinPops((current) => [...current, { id, text: `+${formatCoins(coinsDelta)}` }].slice(-3));
      setCelebrationText(servedDelta >= 2 ? 'Rush handled ✨' : 'Order served ✨');
      setTimeout(() => {
        setCoinPops((current) => current.filter((entry) => entry.id !== id));
      }, 1200);
      setTimeout(() => {
        setCelebrationText('');
      }, 900);
    }
    prevServedRef.current = state.totalServed;
    prevCoinsRef.current = state.lifetimeCoins;
  }, [state.totalServed, state.lifetimeCoins]);

  useEffect(() => {
    const upgradeCount =
      Object.values(state.levels).reduce((sum, value) => sum + value, 0) +
      state.unlockedMenu.length +
      state.staffOwned.length;
    if (upgradeCount > prevUpgradeCountRef.current) {
      setUpgradeFlash('Upgrade purchased ⚡');
      setTimeout(() => setUpgradeFlash(''), 1000);
    }
    prevUpgradeCountRef.current = upgradeCount;
  }, [state.levels, state.unlockedMenu.length, state.staffOwned.length]);

  useEffect(() => {
    if (state.venueTier > prevVenueTierRef.current) {
      setUpgradeFlash(`Venue upgraded to ${stats.venue.name} 🏪`);
      setTimeout(() => setUpgradeFlash(''), 1400);
    }
    prevVenueTierRef.current = state.venueTier;
  }, [state.venueTier, stats.venue.name]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.topLabel}>Coins</Text>
            <Text style={styles.topValue}>{formatCoins(state.coins)}</Text>
            <Text style={styles.topSub}>~{formatCoins(stats.coinsPerMinute)}/min</Text>
          </View>
          <View>
            <Text style={styles.topLabel}>Mood</Text>
            <Text style={styles.topValue}>{formatPercent(state.satisfaction)}</Text>
            <Text style={styles.topSub}>{bottleneck}</Text>
          </View>
        </View>

        {offlineCoins > 0 && (
          <TouchableOpacity style={styles.offlineBanner} onPress={clearOfflineCoins}>
            <Text style={styles.offlineTitle}>Offline stash ready</Text>
            <Text style={styles.offlineValue}>Claimed {formatCoins(offlineCoins)} while you were away</Text>
          </TouchableOpacity>
        )}

        {recoveryNotice ? (
          <TouchableOpacity style={styles.recoveryBanner} onPress={dismissRecoveryNotice}>
            <Text style={styles.recoveryTitle}>Save recovery</Text>
            <Text style={styles.recoveryValue}>{recoveryNotice}</Text>
          </TouchableOpacity>
        ) : null}

        {tutorialStep && (
          <View style={styles.tutorialBanner}>
            <View style={styles.tutorialCopy}>
              <Text style={styles.tutorialEyebrow}>Tutorial guidance</Text>
              <Text style={styles.tutorialTitle}>{tutorialStep.title}</Text>
              <Text style={styles.tutorialBody}>{tutorialStep.body}</Text>
            </View>
            <TouchableOpacity style={styles.tutorialButton} onPress={() => dismissTutorial(tutorialStep.id)}>
              <Text style={styles.tutorialButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.heroCard}>
          <View style={styles.heroHeaderRow}>
            <View style={styles.heroHeaderCopy}>
              <Text style={styles.venueTag}>Tier {stats.venue.id}</Text>
              <Text style={styles.heroTitle}>{stats.venue.name}</Text>
              <Text style={styles.heroSubtitle}>{stats.venue.artLabel}</Text>
            </View>
            <View style={[styles.recommendationPill, recommendation.type === 'venue' && styles.recommendationPillAlt]}>
              <Text style={styles.recommendationText}>{recommendation.label}</Text>
            </View>
          </View>

          {state.activeEvent && (
            <View style={styles.eventBanner}>
              <Text style={styles.eventText}>⚡ {state.activeEvent.name} • {state.activeEvent.label}</Text>
            </View>
          )}

          <View style={styles.sceneCard}>
            <Image source={art.sky} style={styles.sceneSkyImage} resizeMode="cover" />
            <View style={styles.sceneSkyOverlay}>
              <Image source={art.sun} style={styles.sceneSunImage} resizeMode="cover" />
              <View style={styles.cloudOne} />
              <View style={styles.cloudTwo} />
            </View>
            <Image source={art.ground} style={styles.sceneGroundImage} resizeMode="cover" />
            <View style={styles.sceneGroundOverlay}>
              {celebrationText ? <Text style={styles.celebrationText}>{celebrationText}</Text> : null}
              {upgradeFlash ? <Text style={styles.upgradeFlash}>{upgradeFlash}</Text> : null}
              <View style={styles.coinPopLayer}>
                {coinPops.map((pop, index) => (
                  <Text key={pop.id} style={[styles.coinPopText, { top: index * 18 }]}>{pop.text}</Text>
                ))}
              </View>
              <View style={styles.sceneShadow} />
              <View style={styles.sceneStallWrap}>
                <Image source={art.signBoard} style={styles.signBoardImage} resizeMode="cover" />
                <Text style={styles.sceneSignText}>CHAI EMPIRE</Text>
                <Image source={art.stallBody} style={styles.stallBodyImage} resizeMode="stretch" />
                <View style={styles.sceneWindowRow}>
                  <Image source={art.stallWindow} style={styles.windowImage} resizeMode="stretch" />
                  <Image source={art.stallWindow} style={styles.windowImage} resizeMode="stretch" />
                </View>
                <Image source={art.counter} style={styles.counterImage} resizeMode="stretch" />
                <Image source={art.kettle} style={styles.kettleImage} resizeMode="cover" />
              </View>
              <View style={styles.sceneCharacters}>
                <View style={styles.characterPill}><Image source={art.owner} style={styles.characterImage} resizeMode="cover" /></View>
                {Array.from({ length: Math.min(stats.workerCount - 1, 2) }).map((_, idx) => (
                  <View key={idx} style={styles.helperPill}><Image source={art.helper} style={styles.characterImage} resizeMode="cover" /></View>
                ))}
                <View style={styles.customerLane}>
                  {Array.from({ length: stats.queueCapacity }).map((_, index) => {
                    const customer = state.queue[index];
                    const item = customer ? menuItems.find((entry) => entry.id === customer.itemId) : null;
                    return (
                      <View key={index} style={[styles.customerTile, customer && styles.customerTileFilled]}>
                        {customer ? (
                          <>
                            <Image source={art.customer} style={styles.customerImage} resizeMode="cover" />
                            <Text style={styles.customerBadge}>{customer.customerEmoji || '🙂'}</Text>
                            <Text style={styles.orderBadge}>{item?.orderBubble || '☕'}</Text>
                          </>
                        ) : <Text style={styles.customerTileEmoji}>·</Text>}
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>

          <View style={styles.quickStatsRow}>
            <View style={styles.quickStatChip}><Text style={styles.quickStatLabel}>Workers</Text><Text style={styles.quickStatValue}>{stats.workerCount}</Text></View>
            <View style={styles.quickStatChip}><Text style={styles.quickStatLabel}>Queue</Text><Text style={styles.quickStatValue}>{state.queue.length}/{stats.queueCapacity}</Text></View>
            <View style={styles.quickStatChip}><Text style={styles.quickStatLabel}>Served</Text><Text style={styles.quickStatValue}>{state.totalServed}</Text></View>
          </View>

          <View style={styles.metricsRow}>
            <Metric label="Queue" value={`${state.queue.length}/${stats.queueCapacity}`} />
            <Metric label="Served" value={String(state.totalServed)} />
            <Metric label="Business" value={`Lv.${stats.businessLevel}`} />
          </View>

          <View style={[styles.pressureBanner, queuePressure >= 0.85 ? styles.pressureBannerHigh : queuePressure >= 0.6 ? styles.pressureBannerMid : styles.pressureBannerLow]}>
            <Text style={styles.pressureTitle}>{queuePressureLabel}</Text>
            <Text style={styles.pressureCopy}>{queuePressure >= 0.85 ? 'Add speed or staff now, customers are close to dropping.' : queuePressure >= 0.6 ? 'Rush is forming, get ready for the next wave.' : 'Flow is under control, good time to plan upgrades.'}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Rush meter</Text>
          <Text style={styles.sectionCaption}>Fast service builds heat, better payouts, and stronger footfall.</Text>
          <View style={styles.rushHeaderRow}>
            <View>
              <Text style={styles.rushLevelText}>{stats.rushBonus.label}</Text>
              <Text style={styles.rushSubtext}>Current streak: {state.serviceStreak} • Best: {state.bestServiceStreak}</Text>
            </View>
            <View style={styles.rushBadge}>
              <Text style={styles.rushBadgeText}>{Math.round(state.heatMeter)}%</Text>
            </View>
          </View>
          <ProgressLine
            label={state.heatMeter >= 85 ? 'Rush bonus maxed this run' : `Next tier at ${nextRushTarget}% heat`}
            progress={rushProgress}
            done={state.heatMeter >= 85}
          />
          <View style={styles.rewardWrap}>
            <View style={styles.rewardChip}><Text style={styles.rewardChipText}>Payout +{Math.round(stats.rushBonus.payoutBoost * 100)}%</Text></View>
            <View style={styles.rewardChip}><Text style={styles.rewardChipText}>Arrivals +{Math.round(stats.rushBonus.arrivalBoost * 100)}%</Text></View>
            <View style={styles.rewardChip}><Text style={styles.rewardChipText}>Fast serves keep it hot</Text></View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Daily objectives</Text>
          <Text style={styles.sectionCaption}>Small return hooks with instant coin rewards.</Text>
          {dailyObjectives.map((objective) => (
            <View key={objective.id} style={styles.objectiveCard}>
              <View style={styles.objectiveCopy}>
                <Text style={styles.queueRowText}>{objective.label}</Text>
                <Text style={styles.queueRowSub}>{objective.current}/{objective.target} • reward {formatCoins(objective.reward)}</Text>
                <ProgressLine label={objective.claimed ? 'Claimed' : objective.complete ? 'Ready to claim' : 'In progress'} progress={objective.claimed ? 1 : objective.progress} done={objective.claimed || objective.complete} />
              </View>
              <TouchableOpacity
                onPress={() => claimObjective(objective.id)}
                disabled={!objective.complete || objective.claimed}
                style={[styles.claimButton, (!objective.complete || objective.claimed) && styles.claimButtonDisabled]}
              >
                <Text style={styles.claimButtonText}>{objective.claimed ? 'Done' : 'Claim'}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Event pulse</Text>
          {state.activeEvent ? (
            <>
              <View style={[styles.eventDetailCard, state.activeEvent.accent === 'rush' && styles.eventDetailRush, state.activeEvent.accent === 'premium' && styles.eventDetailPremium, state.activeEvent.accent === 'festival' && styles.eventDetailFestival]}>
                <Text style={styles.eventDetailTitle}>⚡ {state.activeEvent.name}</Text>
                <Text style={styles.eventDetailCopy}>{state.activeEvent.label}</Text>
                <Text style={styles.eventDetailTimer}>{activeEventTime}</Text>
              </View>
              <View style={styles.rewardWrap}>
                <View style={styles.rewardChip}><Text style={styles.rewardChipText}>Arrivals +{Math.round((state.activeEvent.arrivalBoost || 0) * 100)}%</Text></View>
                <View style={styles.rewardChip}><Text style={styles.rewardChipText}>Payout +{Math.round((state.activeEvent.payoutBoost || 0) * 100)}%</Text></View>
                <View style={styles.rewardChip}><Text style={styles.rewardChipText}>Patience {state.activeEvent.patienceDelta >= 0 ? '+' : ''}{state.activeEvent.patienceDelta || 0}s</Text></View>
              </View>
            </>
          ) : (
            <Text style={styles.sectionCaption}>No special rush right now. Events will rotate in to spike demand and change the crowd mix.</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Live orders</Text>
          {activeOrderPreview.length ? activeOrderPreview.map((order) => (
            <View key={order.id} style={styles.queueRow}>
              <Text style={styles.queueRowText}>{order.customerEmoji || '🙂'} {order.customerName || 'Regular'}</Text>
              <Text style={styles.queueRowSub}>{order.item?.orderBubble || '☕'} {order.item?.name || 'Basic Chai'} • ready in {order.remaining}s</Text>
            </View>
          )) : <Text style={styles.sectionCaption}>No orders are being prepared right now.</Text>}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Crowd mix</Text>
          <View style={styles.rewardWrap}>
            {stats.customerMix.map((customerType) => (
              <View key={customerType.id} style={styles.rewardChip}>
                <Text style={styles.rewardChipText}>{customerType.emoji} {customerType.name}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.sectionCaption}>Different crowds now have different patience, spend, and menu preferences.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Queue readout</Text>
          {queuePreview.length ? queuePreview.map((customer) => (
            <View key={customer.id} style={styles.queueRow}>
              <Text style={styles.queueRowText}>{customer.customerEmoji || '🙂'} {customer.customerName || 'Regular'}</Text>
              <Text style={styles.queueRowSub}>{customer.item?.orderBubble || '☕'} {customer.item?.name || 'Basic Chai'} • patience {customer.patience}s</Text>
            </View>
          )) : <Text style={styles.sectionCaption}>Queue is clear. New crowds will appear as traffic rises.</Text>}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Next milestone</Text>
          {nextVenue ? (
            <>
              <Text style={styles.venueName}>{nextVenue.name}</Text>
              <ProgressLine label={`Coins ${formatCoins(state.coins)} / ${formatCoins(nextVenue.upgradeCost)}`} progress={state.coins / nextVenue.upgradeCost} />
              <ProgressLine label={`Business Lv.${stats.businessLevel} / ${nextVenue.businessLevelRequired}`} progress={stats.businessLevel / nextVenue.businessLevelRequired} />
              <ProgressLine label={`Reputation Lv.${state.levels.reputation} / ${nextVenue.reputationRequired}`} progress={state.levels.reputation / nextVenue.reputationRequired} />
              <Text style={styles.rewardTitle}>Unlocks</Text>
              <View style={styles.rewardWrap}>
                {nextVenue.rewardPreview.map((reward) => (
                  <View key={reward} style={styles.rewardChip}><Text style={styles.rewardChipText}>{reward}</Text></View>
                ))}
              </View>
            </>
          ) : (
            <Text style={styles.heroSubtitle}>You reached the flagship. Time for art, sound, and endgame loops.</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Session board</Text>
          {milestones.map((goal) => (
            <ProgressLine key={goal.id} label={`${goal.label} (${goal.current}/${goal.target})`} progress={goal.progress} done={goal.complete} />
          ))}
        </View>

        <View style={styles.tabRow}>
          {tabs.map((tab) => (
            <TouchableOpacity key={tab} style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]} onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.card}>
          {activeTab === 'venue' ? (
            <TouchableOpacity style={styles.venueBuyButton} onPress={buyVenue}>
              <Text style={styles.venueBuyTitle}>{nextVenue ? `Upgrade to ${nextVenue.name}` : 'Empire Complete'}</Text>
              <Text style={styles.venueBuyCopy}>{nextVenue ? venueRequirements.length ? venueRequirements.join(' • ') : `Ready for ${formatCoins(nextVenue.upgradeCost)} venue upgrade` : 'Prototype end-state reached'}</Text>
            </TouchableOpacity>
          ) : (
            tabCards.map((card) => {
              if (activeTab === 'staff') {
                const owned = state.staffOwned.includes(card.workerCount);
                const lockedByVenue = state.venueTier < card.requiredVenue || card.workerCount > stats.venue.workerCap;
                return (
                  <CardButton
                    key={card.id}
                    title={card.name}
                    subtitle={card.effectLabel}
                    blurb={lockedByVenue ? `Unlocks at Tier ${card.requiredVenue}` : getShortfallLabel(state.coins, card.unlockCost) || card.blurb}
                    cost={owned ? 'OWNED' : lockedByVenue ? `TIER ${card.requiredVenue}` : formatCoins(card.unlockCost)}
                    disabled={owned || lockedByVenue || state.coins < card.unlockCost}
                    onPress={() => hireStaff(card.id)}
                    highlighted={recommendation.type === 'staff' && !owned}
                  />
                );
              }

              if (activeTab === 'menu') {
                const owned = state.unlockedMenu.includes(card.id);
                const lockedByVenue = card.venueMin > state.venueTier;
                return (
                  <CardButton
                    key={card.id}
                    title={card.name}
                    subtitle={`${card.tag} • ${card.orderBubble}`}
                    blurb={lockedByVenue ? `Unlocks at Tier ${card.venueMin}` : getShortfallLabel(state.coins, card.unlockCost) || `Earn ${formatCoins(card.price)} • ${card.serviceTime}s service`}
                    cost={owned ? 'LIVE' : lockedByVenue ? `TIER ${card.venueMin}` : card.unlockCost ? formatCoins(card.unlockCost) : 'STARTER'}
                    disabled={owned || lockedByVenue || state.coins < card.unlockCost}
                    onPress={() => buyMenuUnlock(card.id)}
                    highlighted={recommendation.type === 'menu' && !owned}
                  />
                );
              }

              const level = state.levels[card.id];
              const cost = getTrackCost(card, level);
              const disabled = level >= card.maxLevel || state.coins < cost;
              return (
                <CardButton
                  key={card.id}
                  title={`${card.name} Lv.${level}`}
                  subtitle={card.effectLabel}
                  blurb={disabled && level < card.maxLevel ? getShortfallLabel(state.coins, cost) || card.blurb : card.blurb}
                  cost={level >= card.maxLevel ? 'MAX' : formatCoins(cost)}
                  disabled={disabled}
                  onPress={() => buyUpgrade(card.id)}
                  highlighted={recommendation.type === activeTab && !disabled}
                />
              );
            })
          )}
        </View>

        <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
          <Text style={styles.resetText}>Reset run</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ label, value }) {
  return (
    <View style={styles.metricBox}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function ProgressLine({ label, progress, done }) {
  return (
    <View style={styles.progressBlock}>
      <Text style={styles.progressLabel}>{label}</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.max(5, Math.min(progress * 100, 100))}%` }, done && styles.progressFillDone]} />
      </View>
    </View>
  );
}

function CardButton({ title, subtitle, blurb, cost, disabled, onPress, highlighted }) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} style={[styles.cardButton, disabled && styles.cardButtonDisabled, highlighted && styles.cardButtonHighlight]}>
      <View style={styles.cardButtonCopy}>
        <Text style={styles.cardButtonTitle}>{title}</Text>
        <Text style={styles.cardButtonSubtitle}>{subtitle}</Text>
        <Text style={styles.cardButtonBlurb}>{blurb}</Text>
      </View>
      <Text style={styles.cardButtonCost}>{cost}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#120B05' },
  loadingScreen: { flex: 1, backgroundColor: '#120B05', alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#FFE8C7', fontSize: 20, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 40, gap: 14 },
  topBar: { backgroundColor: '#201108', borderRadius: 20, padding: 16, flexDirection: 'row', justifyContent: 'space-between', borderWidth: 1, borderColor: '#3B2617' },
  topLabel: { color: '#D3B895', fontSize: 12, textTransform: 'uppercase' },
  topValue: { color: '#FFF2DE', fontSize: 28, fontWeight: '800', marginTop: 4 },
  topSub: { color: '#BDA17D', marginTop: 2, maxWidth: 140 },
  offlineBanner: { backgroundColor: '#6A440F', borderRadius: 18, padding: 14 },
  offlineTitle: { color: '#FFF4DD', fontWeight: '800', fontSize: 16 },
  offlineValue: { color: '#F5DCAA', marginTop: 4 },
  recoveryBanner: { backgroundColor: '#4B3310', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: '#D1A545' },
  recoveryTitle: { color: '#FFF0B0', fontWeight: '800', fontSize: 16 },
  recoveryValue: { color: '#F7E7BF', marginTop: 4 },
  tutorialBanner: { backgroundColor: '#2B1C40', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: '#7D69A8', flexDirection: 'row', gap: 12, alignItems: 'center' },
  tutorialCopy: { flex: 1, gap: 4 },
  tutorialEyebrow: { color: '#D9C8FF', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  tutorialTitle: { color: '#FFF4E6', fontSize: 16, fontWeight: '800' },
  tutorialBody: { color: '#E7DDF8', fontSize: 13, lineHeight: 18 },
  tutorialButton: { backgroundColor: '#F59E0B', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  tutorialButtonText: { color: '#1A0E06', fontWeight: '800' },
  heroCard: { backgroundColor: '#2A180B', borderRadius: 24, padding: 18, gap: 14, borderWidth: 1, borderColor: '#4A2A17' },
  heroHeader: { gap: 10 },
  heroHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  heroHeaderCopy: { flex: 1 },
  venueTag: { color: '#F59E0B', fontWeight: '700', textTransform: 'uppercase', fontSize: 12 },
  heroTitle: { color: '#FFF4E6', fontSize: 28, fontWeight: '800' },
  heroSubtitle: { color: '#D5BDA0', marginTop: 4 },
  recommendationPill: { alignSelf: 'flex-start', backgroundColor: '#5A3A14', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  recommendationPillAlt: { backgroundColor: '#22452A' },
  recommendationText: { color: '#FFEDC9', fontWeight: '700' },
  eventBanner: { backgroundColor: '#5D1E2C', borderRadius: 14, padding: 10 },
  eventText: { color: '#FFD7DE', fontWeight: '700' },
  sceneCard: { backgroundColor: '#1A0E06', borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: '#3A2314' },
  sceneSkyImage: { width: '100%', height: 96 },
  sceneSkyOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 96 },
  sceneSunImage: { position: 'absolute', right: 24, top: 18, width: 52, height: 52, borderRadius: 999 },
  cloudOne: { position: 'absolute', left: 24, top: 24, width: 88, height: 24, borderRadius: 999, backgroundColor: '#F9EAD2' },
  cloudTwo: { position: 'absolute', left: 90, top: 40, width: 62, height: 18, borderRadius: 999, backgroundColor: '#F9EAD2' },
  sceneGroundImage: { width: '100%', height: 170 },
  sceneGroundOverlay: { position: 'absolute', left: 0, right: 0, top: 96, height: 170, paddingHorizontal: 14, paddingTop: 18, paddingBottom: 14 },
  coinPopLayer: { position: 'absolute', right: 16, top: 12, alignItems: 'flex-end' },
  coinPopText: { position: 'absolute', right: 0, color: '#FFE38A', fontSize: 16, fontWeight: '900', textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  celebrationText: { position: 'absolute', top: 8, left: 14, color: '#FFF4E4', fontSize: 14, fontWeight: '800', backgroundColor: 'rgba(42,24,11,0.78)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  upgradeFlash: { position: 'absolute', top: 42, left: 14, color: '#1A0E06', fontSize: 13, fontWeight: '900', backgroundColor: '#F5C05A', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  sceneShadow: { position: 'absolute', left: 110, right: 90, top: 122, height: 28, borderRadius: 999, backgroundColor: '#6B341F', opacity: 0.35 },
  sceneStallWrap: { alignSelf: 'flex-start', width: 158, marginLeft: 6 },
  signBoardImage: { alignSelf: 'center', width: 120, height: 34, borderRadius: 12, marginBottom: 6 },
  sceneSignText: { color: '#FFEBCB', fontSize: 12, fontWeight: '800' },
  stallBodyImage: { width: 158, height: 96, borderRadius: 16 },
  sceneWindowRow: { position: 'absolute', top: 48, left: 18, right: 18, flexDirection: 'row', justifyContent: 'space-around' },
  windowImage: { width: 46, height: 46, borderRadius: 10 },
  counterImage: { width: 158, height: 14, borderRadius: 8, marginTop: -2 },
  kettleImage: { position: 'absolute', right: -18, bottom: 6, width: 58, height: 58, borderRadius: 29 },
  sceneCharacters: { marginTop: 16, flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  characterPill: { width: 58, height: 84, borderRadius: 18, backgroundColor: '#F2B861', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  helperPill: { width: 42, height: 70, borderRadius: 16, backgroundColor: '#76B66A', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  characterImage: { width: '100%', height: '100%' },
  customerLane: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8, marginLeft: 8 },
  customerTile: { width: 38, height: 52, borderRadius: 14, backgroundColor: '#5F311D', alignItems: 'center', justifyContent: 'center' },
  customerTileFilled: { backgroundColor: '#D2874A' },
  customerTileEmoji: { color: '#FFF4E4', fontWeight: '800', fontSize: 18 },
  customerBadge: { position: 'absolute', top: -7, left: -4, fontSize: 12 },
  orderBadge: { position: 'absolute', bottom: -8, right: -2, fontSize: 12 },
  customerImage: { width: '100%', height: '100%' },
  quickStatsRow: { flexDirection: 'row', gap: 8 },
  quickStatChip: { flex: 1, backgroundColor: '#1A0E06', borderRadius: 16, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#392114' },
  quickStatLabel: { color: '#D5BDA0', fontSize: 11, textTransform: 'uppercase' },
  quickStatValue: { color: '#FFF3E0', fontSize: 18, fontWeight: '800', marginTop: 4 },
  metricsRow: { flexDirection: 'row', gap: 10 },
  metricBox: { flex: 1, backgroundColor: '#1A0E06', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#392114' },
  metricLabel: { color: '#CDAF87', fontSize: 12, textTransform: 'uppercase' },
  metricValue: { color: '#FFF2DD', fontSize: 22, fontWeight: '800', marginTop: 4 },
  pressureBanner: { borderRadius: 16, padding: 12, borderWidth: 1 },
  pressureBannerLow: { backgroundColor: '#16311F', borderColor: '#2D6B45' },
  pressureBannerMid: { backgroundColor: '#4A3414', borderColor: '#A66B1F' },
  pressureBannerHigh: { backgroundColor: '#4C1D21', borderColor: '#B5444F' },
  pressureTitle: { color: '#FFF4E4', fontSize: 14, fontWeight: '800' },
  pressureCopy: { color: '#E9D4BC', fontSize: 12, marginTop: 4, lineHeight: 17 },
  card: { backgroundColor: '#201108', borderRadius: 20, padding: 16, gap: 10, borderWidth: 1, borderColor: '#3B2617' },
  sectionTitle: { color: '#FFE8C7', fontSize: 18, fontWeight: '800' },
  sectionCaption: { color: '#CDA98A', fontSize: 13, lineHeight: 18, marginTop: 2 },
  objectiveCard: { backgroundColor: '#2A180B', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#452B18', flexDirection: 'row', gap: 12, alignItems: 'center' },
  objectiveCopy: { flex: 1, gap: 6 },
  claimButton: { backgroundColor: '#F59E0B', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  claimButtonDisabled: { backgroundColor: '#4C3520' },
  claimButtonText: { color: '#1A0E06', fontWeight: '800' },
  eventDetailCard: { borderRadius: 18, padding: 14, backgroundColor: '#2E213C', borderWidth: 1, borderColor: '#7D69A8' },
  eventDetailRush: { backgroundColor: '#4C1D21', borderColor: '#B5444F' },
  eventDetailPremium: { backgroundColor: '#3B2A12', borderColor: '#C68B2B' },
  eventDetailFestival: { backgroundColor: '#3B2313', borderColor: '#D46A1D' },
  eventDetailTitle: { color: '#FFF4E4', fontSize: 16, fontWeight: '800' },
  eventDetailCopy: { color: '#F1DFCA', marginTop: 4, fontSize: 13, lineHeight: 18 },
  eventDetailTimer: { color: '#FFE3AE', marginTop: 8, fontWeight: '700' },
  venueName: { color: '#FFF4E4', fontSize: 22, fontWeight: '800' },
  rewardTitle: { color: '#D3B895', marginTop: 4, fontWeight: '700' },
  rewardWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rewardChip: { backgroundColor: '#59351B', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  rewardChipText: { color: '#FFE9C7', fontWeight: '600' },
  queueRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,244,228,0.08)' },
  queueRowText: { color: '#FFF4E4', fontSize: 14, fontWeight: '700' },
  queueRowSub: { color: '#CDA98A', fontSize: 12, marginTop: 3 },
  rushHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  rushLevelText: { color: '#FFF4E4', fontSize: 18, fontWeight: '800' },
  rushSubtext: { color: '#D6B694', fontSize: 13, marginTop: 4 },
  rushBadge: { backgroundColor: '#7A2E12', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#F59E0B' },
  rushBadgeText: { color: '#FFE7BE', fontWeight: '800' },
  progressBlock: { gap: 6 },
  progressLabel: { color: '#E7D6BF' },
  progressTrack: { height: 10, borderRadius: 999, backgroundColor: '#4B2E1A', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: '#F59E0B' },
  progressFillDone: { backgroundColor: '#2FA163' },
  tabRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tabButton: { backgroundColor: '#2A180B', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#452B18' },
  tabButtonActive: { backgroundColor: '#F59E0B' },
  tabText: { color: '#E6D4BC', fontWeight: '700', fontSize: 12 },
  tabTextActive: { color: '#1A0E06' },
  venueBuyButton: { backgroundColor: '#6D3C12', borderRadius: 18, padding: 16 },
  venueBuyTitle: { color: '#FFF4E4', fontSize: 18, fontWeight: '800' },
  venueBuyCopy: { color: '#E6CAA1', marginTop: 6 },
  cardButton: { backgroundColor: '#6D3C12', borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderWidth: 1, borderColor: '#A26331' },
  cardButtonDisabled: { backgroundColor: '#382216', opacity: 0.7 },
  cardButtonHighlight: { borderWidth: 1, borderColor: '#F5C05A' },
  cardButtonCopy: { flex: 1 },
  cardButtonTitle: { color: '#FFF4E6', fontSize: 16, fontWeight: '800' },
  cardButtonSubtitle: { color: '#F0D0A2', marginTop: 3, fontWeight: '700' },
  cardButtonBlurb: { color: '#DABB98', marginTop: 4 },
  cardButtonCost: { color: '#FFE7BE', fontSize: 18, fontWeight: '800' },
  resetButton: { alignSelf: 'center', marginTop: 6, paddingHorizontal: 14, paddingVertical: 10 },
  resetText: { color: '#B9966E', fontWeight: '700' },
});
