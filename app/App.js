import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useGameState } from './src/hooks/useGameState';
import { getTrackCost } from './src/game/simulation';
import { formatCoins, formatPercent } from './src/utils/formatters';
import { pixelSprites } from './src/data/pixelSprites';
import { GameDrawer } from './src/components/GameDrawer';
import { GameFeedback } from './src/components/GameFeedback';
import { PriorityOrderPrompt } from './src/components/PriorityOrderPrompt';
import { VenueDecor } from './src/components/VenueDecor';
import { SessionLoop } from './src/components/SessionLoop';
import { RewardedAdModal } from './src/components/RewardedAdModal';

const TABS = [
  { id: 'speed', label: 'UPGRADES', icon: '☕' },
  { id: 'staff', label: 'STAFF', icon: '👨' },
  { id: 'quality', label: 'QUALITY', icon: '★' },
  { id: 'menu', label: 'MENU', icon: '▤' },
  { id: 'venue', label: 'VENUE', icon: '⌂' },
];

const customerSprites = {
  'office-worker': pixelSprites.officeWorker,
  student: pixelSprites.student,
  traveler: pixelSprites.traveler,
  'uncle-group': pixelSprites.uncle,
};

const getShortfall = (coins, cost) => Math.max(0, cost - coins);
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

export default function App() {
  const { width } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState('speed');
  const [activePanel, setActivePanel] = useState(null);
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
    serviceChoices,
    offlineCoins,
    recoveryNotice,
    clearOfflineCoins,
    dismissRecoveryNotice,
    chooseService,
    openSessionReward,
    claimPendingReward,
    acceptPriority,
    useKettleBoost,
    buyUpgrade,
    hireStaff,
    buyMenuUnlock,
    buyVenue,
    claimObjective,
    claimMilestone,
    dismissTutorial,
    resetGame,
    upgradeTracks,
    staffUnlocks,
    menuItems,
  } = useGameState();

  const compact = width < 390;
  const queuePressure = state.queue.length / Math.max(1, stats.queueCapacity);
  const queuePreview = state.queue.slice(0, Math.min(5, stats.queueCapacity));
  const nextVenue = venueProgress.next;
  const activeOrderCount = state.activeOrders.length;
  const helperCount = Math.max(0, stats.workerCount - 1);

  const tabCards = useMemo(() => {
    if (activeTab === 'speed' || activeTab === 'quality') {
      return upgradeTracks.filter((track) => track.tab === activeTab);
    }
    if (activeTab === 'staff') return staffUnlocks;
    if (activeTab === 'menu') return menuItems;
    return [];
  }, [activeTab, menuItems, staffUnlocks, upgradeTracks]);

  const confirmReset = () => {
    const message = 'This erases the local Chai Empire save and starts a new stall.';
    if (Platform.OS === 'web') {
      if (typeof globalThis.confirm === 'function' && globalThis.confirm(`Reset Chai Empire?\n\n${message}`)) {
        resetGame();
      }
      return;
    }

    Alert.alert('Reset Chai Empire?', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: resetGame },
    ]);
  };

  if (!isLoaded) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <StatusBar style="light" />
        <Text style={styles.loadingCup}>☕</Text>
        <Text style={styles.loadingTitle}>HEATING THE KETTLE...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hudRow, compact && styles.hudRowCompact]}>
          <HudPanel flex={1.15} label="COINS" value={formatCoins(state.coins)} sub={`+${formatCoins(stats.coinsPerMinute)}/min`} icon="●" />
          <HudPanel flex={0.8} label="MOOD" value={formatPercent(state.satisfaction)} sub={bottleneck} icon="☺" />
          <View style={[styles.pixelPanel, styles.rushPanel, compact && styles.rushPanelCompact]}>
            <Text style={styles.hudLabel}>RUSH METER</Text>
            <View style={styles.rushRow}>
              <Text style={styles.rushCup}>☕</Text>
              <PixelBar progress={(state.heatMeter || 0) / 100} danger={(state.heatMeter || 0) >= 70} style={styles.rushBar} />
            </View>
            <Text style={styles.hudSub}>{stats.rushBonus.label.toUpperCase()}</Text>
          </View>
        </View>

        {offlineCoins > 0 ? (
          <TouchableOpacity style={styles.noticeGreen} onPress={clearOfflineCoins}>
            <Text style={styles.noticeTitle}>OFFLINE STASH +{formatCoins(offlineCoins)}</Text>
            <Text style={styles.noticeText}>Tap to dismiss</Text>
          </TouchableOpacity>
        ) : null}

        {recoveryNotice ? (
          <TouchableOpacity style={styles.noticeAmber} onPress={dismissRecoveryNotice}>
            <Text style={styles.noticeTitle}>SAVE RECOVERY</Text>
            <Text style={styles.noticeText}>{recoveryNotice}</Text>
          </TouchableOpacity>
        ) : null}

        {tutorialStep ? (
          <View style={styles.tutorialPanel}>
            <View style={{ flex: 1 }}>
              <Text style={styles.tutorialTitle}>{tutorialStep.title.toUpperCase()}</Text>
              <Text style={styles.tutorialText}>{tutorialStep.body}</Text>
            </View>
            <TouchableOpacity style={styles.smallGreenButton} onPress={() => dismissTutorial(tutorialStep.id)}>
              <Text style={styles.smallButtonText}>GOT IT</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <SessionLoop
          run={state.sessionRun}
          choices={serviceChoices}
          onChoose={chooseService}
          onClaim={openSessionReward}
        />

        <View style={[styles.sceneFrame, state.kettleBoostRemaining > 0 && styles.sceneFrameBoost]}>
          <GameFeedback state={state} />
          <View style={styles.bigSignOuter}>
            <View style={styles.bigSignInner}>
              <Text style={[styles.gameTitle, compact && styles.gameTitleCompact]}>CHAI EMPIRE</Text>
              <Text style={styles.tagline}>ONE KETTLE. ONE DREAM.</Text>
            </View>
          </View>

          <View style={styles.sceneSky}>
            <VenueDecor tier={state.venueTier} />
            <View style={styles.sunPixel} />
            <View style={[styles.cloudPixel, { left: '10%', top: 20 }]} />
            <View style={[styles.cloudPixel, { right: '8%', top: 42, width: 46 }]} />
            <View style={styles.cityStrip}>
              <View style={styles.cityBlock} />
              <View style={[styles.cityBlock, { height: 28 }]} />
              <View style={[styles.cityBlock, { height: 18 }]} />
              <View style={[styles.cityBlock, { height: 34 }]} />
              <View style={[styles.cityBlock, { height: 24 }]} />
              <View style={[styles.cityBlock, { height: 30 }]} />
            </View>

            {state.activeEvent ? (
              <View style={styles.eventRibbon}>
                <Text style={styles.eventText}>⚡ {state.activeEvent.name.toUpperCase()} · {state.activeEvent.remaining}s</Text>
              </View>
            ) : null}

            <PriorityOrderPrompt
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

            <View style={styles.stallRoof}>
              {Array.from({ length: 9 }).map((_, i) => <View key={i} style={styles.roofStripe} />)}
            </View>

            <View style={styles.stallBody}>
              <View style={styles.stallHeader}>
                <Text style={styles.stallHeaderText}>☕ CHAI EMPIRE ☕</Text>
              </View>
              <View style={styles.stallInterior}>
                <View style={styles.propShelf}>
                  <Text style={styles.jar}>▣</Text><Text style={styles.jar}>▣</Text><Text style={styles.jar}>▣</Text>
                </View>
                <View style={styles.workerRow}>
                  <Sprite source={pixelSprites.owner} size={compact ? 52 : 60} animated />
                  <View style={[styles.kettleStation, state.kettleBoostRemaining > 0 && styles.kettleStationBoost]}>
                    <Text style={styles.steam}>≈</Text>
                    <Text style={styles.kettleEmoji}>♨</Text>
                    <Text style={styles.chaiTray}>▥▥▥</Text>
                    <Text style={styles.brewingLabel}>{activeOrderCount ? `${activeOrderCount} BREWING` : 'READY'}</Text>
                  </View>
                  <View style={styles.helperCluster}>
                    {Array.from({ length: helperCount }).map((_, index) => (
                      <Sprite
                        key={`helper-${index}`}
                        source={pixelSprites.helper}
                        size={compact ? 36 : 42}
                        animated
                        delay={index * 110}
                      />
                    ))}
                  </View>
                </View>
              </View>
              <View style={styles.counterFront}>
                <Text style={styles.counterText}>CHAI PE CHARCHA, YAAR!</Text>
              </View>
            </View>

            <View style={styles.queueRoad}>
              {queuePreview.length ? queuePreview.map((customer, index) => {
                const item = menuItems.find((entry) => entry.id === customer.itemId);
                const patienceRatio = Math.max(0, Math.min(1, customer.patience / Math.max(1, customer.maxPatience || customer.patience || 1)));
                return (
                  <View key={customer.id} style={styles.customerSlot}>
                    <View style={[styles.orderBubble, customer.priorityOrder && styles.orderBubblePriority]}>
                      <Text style={styles.orderBubbleText}>{customer.priorityOrder ? `⚡ ${item?.orderBubble || '☕'}` : item?.orderBubble || '☕'}</Text>
                    </View>
                    <Sprite source={customerSprites[customer.customerTypeId] || pixelSprites.officeWorker} size={compact ? 42 : 48} animated delay={index * 90} />
                    <View style={styles.patienceTrack}>
                      <View style={[styles.patienceFill, { width: `${patienceRatio * 100}%` }, patienceRatio < 0.35 && styles.patienceLow]} />
                    </View>
                  </View>
                );
              }) : (
                <View style={styles.emptyQueue}>
                  <Text style={styles.emptyQueueText}>NEXT CUSTOMERS ARRIVING...</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.sceneStats}>
            <SceneStat label="WORKERS" value={stats.workerCount} />
            <SceneStat label="QUEUE" value={`${state.queue.length}/${stats.queueCapacity}`} />
            <SceneStat label="SERVED" value={state.totalServed} />
            <SceneStat label="BUSINESS" value={`LV.${stats.businessLevel}`} />
          </View>

          <View style={[styles.pressureStrip, queuePressure >= 0.75 && styles.pressureStripHot]}>
            <Text style={styles.pressureText}>
              {queuePressure >= 0.75 ? '⚠ QUEUE PRESSURE: UPGRADE SPEED OR STAFF' : `★ ${recommendation.label.toUpperCase()}`}
            </Text>
          </View>
        </View>

        <View style={styles.tabsRow}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabButton, activeTab === tab.id && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: activeTab === tab.id }}
              accessibilityLabel={`${tab.label} tab`}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.upgradeDeck}>
          {activeTab === 'venue' ? (
            <VenueCard
              nextVenue={nextVenue}
              coins={state.coins}
              businessLevel={stats.businessLevel}
              reputation={state.levels.reputation}
              onBuy={buyVenue}
            />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardScroller}>
              {tabCards.map((card) => (
                <UpgradeCard
                  key={card.id}
                  card={card}
                  activeTab={activeTab}
                  state={state}
                  stats={stats}
                  buyUpgrade={buyUpgrade}
                  hireStaff={hireStaff}
                  buyMenuUnlock={buyMenuUnlock}
                />
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.objectivesPanel}>
          <Text style={styles.objectivesTitle}>DAILY MISSIONS</Text>
          {dailyObjectives.map((objective) => (
            <View key={objective.id} style={[styles.objectiveStrip, objective.complete && !objective.claimed && styles.objectiveStripReady]}>
              <View style={styles.objectiveIcon}><Text style={styles.objectiveIconText}>{objective.claimed ? '✓' : '•'}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.objectiveLabel}>{objective.label.toUpperCase()}</Text>
                <PixelBar progress={objective.progress} />
                <Text style={styles.objectiveProgress}>{objective.current}/{objective.target} · REWARD {formatCoins(objective.reward)}</Text>
              </View>
              <TouchableOpacity
                style={[styles.claimButton, (!objective.complete || objective.claimed) && styles.claimButtonDisabled]}
                disabled={!objective.complete || objective.claimed}
                onPress={() => claimObjective(objective.id)}
                accessibilityRole="button"
                accessibilityLabel={`Claim ${objective.label} reward`}
                accessibilityState={{ disabled: !objective.complete || objective.claimed }}
              >
                <Text style={styles.claimText}>{objective.claimed ? 'DONE' : objective.complete ? 'CLAIM' : 'WAIT'}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <GameDrawer
          panel={activePanel}
          onClose={() => setActivePanel(null)}
          dailyObjectives={dailyObjectives}
          milestones={milestones}
          state={state}
          stats={stats}
          venueProgress={venueProgress}
          onClaimObjective={claimObjective}
          onClaimMilestone={claimMilestone}
          onUseKettleBoost={useKettleBoost}
          onReset={confirmReset}
        />

        <View style={styles.bottomNav}>
          <BottomNav
            icon="☷"
            label={`${dailyObjectives.filter((item) => !item.claimed).length} MISSIONS`}
            onPress={() => setActivePanel(activePanel === 'missions' ? null : 'missions')}
            active={activePanel === 'missions'}
          />
          <BottomNav
            icon="★"
            label={milestones.some((item) => item.complete && !item.claimed)
              ? `${milestones.filter((item) => item.complete && !item.claimed).length} REWARD READY`
              : `${milestones.filter((item) => item.claimed).length}/${milestones.length} GOALS`}
            onPress={() => setActivePanel(activePanel === 'milestones' ? null : 'milestones')}
            active={activePanel === 'milestones'}
          />
          <View style={[styles.centerBadge, state.kettleBoostRemaining > 0 && styles.centerBadgeBoost]}>
            <Text style={styles.centerBadgeCup}>☕</Text>
            <Text style={styles.centerBadgeText}>{state.kettleBoostRemaining > 0 ? `BOOST ${Math.ceil(state.kettleBoostRemaining)}s` : 'AUTO SERVING'}</Text>
          </View>
          <BottomNav
            icon="⚡"
            label={`${Math.round(state.heatMeter || 0)}% RUSH`}
            onPress={() => setActivePanel(activePanel === 'rush' ? null : 'rush')}
            active={activePanel === 'rush'}
          />
          <BottomNav
            icon="⚙"
            label="SETTINGS"
            onPress={() => setActivePanel(activePanel === 'settings' ? null : 'settings')}
            active={activePanel === 'settings'}
          />
        </View>
      </ScrollView>
      <RewardedAdModal reward={state.pendingReward} onResolve={claimPendingReward} />
    </SafeAreaView>
  );
}

function Sprite({ source, size, animated = false, delay = 0 }) {
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(bob, { toValue: -3, duration: 320, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(bob, { toValue: 0, duration: 320, useNativeDriver: USE_NATIVE_DRIVER }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [animated, bob, delay]);

  const imageStyle = { width: size, height: size * 1.55 };
  if (!animated) {
    return <Image source={{ uri: source }} style={imageStyle} resizeMode="contain" />;
  }

  return (
    <Animated.Image
      source={{ uri: source }}
      style={[imageStyle, { transform: [{ translateY: bob }] }]}
      resizeMode="contain"
    />
  );
}

function HudPanel({ label, value, sub, icon, flex }) {
  return (
    <View style={[styles.pixelPanel, { flex }]}>
      <Text style={styles.hudLabel}>{label}</Text>
      <View style={styles.hudValueRow}>
        <Text style={styles.hudIcon}>{icon}</Text>
        <Text style={styles.hudValue}>{value}</Text>
      </View>
      <Text numberOfLines={1} style={styles.hudSub}>{sub}</Text>
    </View>
  );
}

function PixelBar({ progress, danger, style }) {
  const value = Math.max(0, Math.min(1, progress || 0));
  return (
    <View style={[styles.pixelBarTrack, style]}>
      <View style={[styles.pixelBarFill, { width: `${value * 100}%` }, danger && styles.pixelBarDanger]} />
    </View>
  );
}

function SceneStat({ label, value }) {
  return (
    <View style={styles.sceneStat}>
      <Text style={styles.sceneStatLabel}>{label}</Text>
      <Text style={styles.sceneStatValue}>{value}</Text>
    </View>
  );
}

function UpgradeCard({ card, activeTab, state, stats, buyUpgrade, hireStaff, buyMenuUnlock }) {
  if (activeTab === 'staff') {
    const owned = state.staffOwned.includes(card.workerCount);
    const locked = state.venueTier < card.requiredVenue || card.workerCount > stats.venue.workerCap;
    const disabled = owned || locked || state.coins < card.unlockCost;
    return (
      <PixelCard
        title={card.name}
        icon="👨"
        level={owned ? 'OWNED' : `WORKER ${card.workerCount}`}
        description={locked ? `UNLOCKS AT TIER ${card.requiredVenue}` : card.blurb}
        price={owned ? 'HIRED' : formatCoins(card.unlockCost)}
        disabled={disabled}
        onPress={() => hireStaff(card.id)}
      />
    );
  }

  if (activeTab === 'menu') {
    const owned = state.unlockedMenu.includes(card.id);
    const locked = card.venueMin > state.venueTier;
    const menuFull = !owned && state.unlockedMenu.length >= stats.venue.menuCap;
    const disabled = owned || locked || menuFull || state.coins < card.unlockCost;
    const description = locked
      ? `UNLOCKS AT TIER ${card.venueMin}`
      : menuFull
        ? `MENU FULL ${state.unlockedMenu.length}/${stats.venue.menuCap} · UPGRADE VENUE`
        : `${formatCoins(card.price)} ORDER · ${card.serviceTime}s`;
    return (
      <PixelCard
        title={card.name}
        icon={card.orderBubble || '☕'}
        level={owned ? 'LIVE' : card.tag.toUpperCase()}
        description={description}
        price={owned ? 'LIVE' : menuFull ? 'FULL' : card.unlockCost ? formatCoins(card.unlockCost) : 'STARTER'}
        disabled={disabled}
        onPress={() => buyMenuUnlock(card.id)}
      />
    );
  }

  const level = state.levels[card.id];
  const cost = getTrackCost(card, level);
  const maxed = level >= card.maxLevel;
  const disabled = maxed || state.coins < cost;
  const shortfall = getShortfall(state.coins, cost);
  return (
    <PixelCard
      title={card.name}
      icon={card.id === 'speed' ? '♨' : card.id === 'service' ? '⇈' : card.id === 'quality' ? '★' : '☷'}
      level={`LEVEL ${level}`}
      description={shortfall && !maxed ? `NEED ${formatCoins(shortfall)} MORE` : card.effectLabel.toUpperCase()}
      price={maxed ? 'MAX' : formatCoins(cost)}
      disabled={disabled}
      onPress={() => buyUpgrade(card.id)}
    />
  );
}

function PixelCard({ title, icon, level, description, price, disabled, onPress }) {
  return (
    <View style={[styles.upgradeCard, disabled && styles.upgradeCardDisabled]}>
      <Text numberOfLines={1} style={styles.upgradeTitle}>{title.toUpperCase()}</Text>
      <Text style={styles.upgradeIcon}>{icon}</Text>
      <Text style={styles.upgradeLevel}>{level}</Text>
      <Text numberOfLines={2} style={styles.upgradeDescription}>{description}</Text>
      <TouchableOpacity disabled={disabled} onPress={onPress} style={[styles.priceButton, disabled && styles.priceButtonDisabled]} accessibilityRole="button" accessibilityState={{ disabled }}>
        <Text style={styles.priceText}>{price}</Text>
      </TouchableOpacity>
    </View>
  );
}

function VenueCard({ nextVenue, coins, businessLevel, reputation, onBuy }) {
  if (!nextVenue) {
    return (
      <View style={styles.venueCard}>
        <Text style={styles.venueCardTitle}>NEIGHBORHOOD FLAGSHIP</Text>
        <Text style={styles.venueCardBody}>EMPIRE MILESTONE REACHED. NEXT: NEW CITY ZONES.</Text>
      </View>
    );
  }

  const ready = coins >= nextVenue.upgradeCost && businessLevel >= nextVenue.businessLevelRequired && reputation >= nextVenue.reputationRequired;
  return (
    <View style={styles.venueCard}>
      <Text style={styles.venueEyebrow}>NEXT VENUE</Text>
      <Text style={styles.venueCardTitle}>{nextVenue.name.toUpperCase()}</Text>
      <Requirement label="COINS" current={coins} target={nextVenue.upgradeCost} format />
      <Requirement label="BUSINESS" current={businessLevel} target={nextVenue.businessLevelRequired} />
      <Requirement label="REPUTATION" current={reputation} target={nextVenue.reputationRequired} />
      <TouchableOpacity disabled={!ready} onPress={onBuy} style={[styles.venueButton, !ready && styles.priceButtonDisabled]}>
        <Text style={styles.venueButtonText}>{ready ? 'UPGRADE VENUE' : 'REQUIREMENTS NOT MET'}</Text>
      </TouchableOpacity>
    </View>
  );
}

function Requirement({ label, current, target, format }) {
  return (
    <View style={styles.requirementRow}>
      <Text style={styles.requirementLabel}>{label}</Text>
      <Text style={styles.requirementValue}>{format ? `${formatCoins(current)} / ${formatCoins(target)}` : `${current} / ${target}`}</Text>
      <PixelBar progress={current / Math.max(1, target)} />
    </View>
  );
}

function BottomNav({ icon, label, onPress, active = false }) {
  return (
    <TouchableOpacity
      style={[styles.bottomNavItem, active && styles.bottomNavItemActive]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
    >
      <Text style={styles.bottomNavIcon}>{icon}</Text>
      <Text style={styles.bottomNavLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const C = {
  ink: '#190F08',
  dark: '#2A1609',
  dark2: '#3A210E',
  wood: '#6B3814',
  wood2: '#9A541E',
  gold: '#F6B93B',
  cream: '#F7E1A6',
  green: '#5F9D22',
  green2: '#8EC43F',
  orange: '#D95F17',
  red: '#C63D22',
  sky: '#74C6E8',
  road: '#73634E',
};

const pixelShadow = {
  shadowColor: '#000',
  shadowOpacity: 0.7,
  shadowRadius: 0,
  shadowOffset: { width: 3, height: 3 },
  elevation: 5,
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.ink },
  screen: { flex: 1, backgroundColor: C.ink },
  content: { padding: 8, paddingBottom: 18, gap: 8 },
  loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.ink },
  loadingCup: { fontSize: 50 },
  loadingTitle: { color: C.gold, fontWeight: '900', letterSpacing: 2, marginTop: 12 },

  hudRow: { flexDirection: 'row', gap: 6 },
  hudRowCompact: { flexWrap: 'wrap' },
  pixelPanel: { backgroundColor: C.dark, borderWidth: 3, borderColor: C.wood2, padding: 6, minHeight: 70, ...pixelShadow },
  rushPanel: { flex: 1.1 },
  rushPanelCompact: { flexBasis: '100%' },
  hudLabel: { color: C.gold, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  hudValueRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  hudIcon: { color: C.gold, fontSize: 17, fontWeight: '900' },
  hudValue: { color: '#FFF7DD', fontSize: 17, fontWeight: '900' },
  hudSub: { color: C.green2, fontSize: 8, fontWeight: '800', marginTop: 2 },
  rushRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  rushCup: { fontSize: 14 },
  pixelBarTrack: { height: 9, width: '100%', borderWidth: 2, borderColor: '#140B05', backgroundColor: '#4B3728', padding: 1 },
  rushBar: { flex: 1, width: 'auto' },
  pixelBarFill: { height: '100%', backgroundColor: C.green2 },
  pixelBarDanger: { backgroundColor: C.orange },

  noticeGreen: { backgroundColor: '#284D16', borderWidth: 3, borderColor: C.green2, padding: 8 },
  noticeAmber: { backgroundColor: '#5C3A12', borderWidth: 3, borderColor: C.gold, padding: 8 },
  noticeTitle: { color: '#FFF0BF', fontWeight: '900', fontSize: 11 },
  noticeText: { color: '#F2DFAE', fontSize: 9, marginTop: 2 },
  tutorialPanel: { backgroundColor: '#43230F', borderWidth: 3, borderColor: C.gold, padding: 8, flexDirection: 'row', gap: 8, alignItems: 'center' },
  tutorialTitle: { color: C.gold, fontWeight: '900', fontSize: 11 },
  tutorialText: { color: C.cream, fontSize: 10, marginTop: 2, lineHeight: 14 },
  smallGreenButton: { backgroundColor: C.green, borderWidth: 3, borderColor: '#315912', paddingVertical: 7, paddingHorizontal: 9 },
  smallButtonText: { color: '#FFF7DD', fontSize: 9, fontWeight: '900' },

  sceneFrame: { borderWidth: 4, borderColor: C.wood2, backgroundColor: C.dark, ...pixelShadow },
  sceneFrameBoost: { borderColor: C.gold, shadowOpacity: 0.95, elevation: 10 },
  bigSignOuter: { backgroundColor: '#3C200F', padding: 5, borderBottomWidth: 3, borderColor: '#1A0D05' },
  bigSignInner: { backgroundColor: C.wood, borderWidth: 3, borderColor: '#BB7126', paddingVertical: 5, alignItems: 'center' },
  gameTitle: { color: C.gold, fontSize: 26, fontWeight: '900', letterSpacing: 2 },
  gameTitleCompact: { fontSize: 22 },
  tagline: { color: '#CDE77B', fontSize: 8, fontWeight: '900', letterSpacing: 1.5, marginTop: 1 },
  sceneSky: { height: 360, backgroundColor: C.sky, overflow: 'hidden' },
  sunPixel: { position: 'absolute', top: 16, right: 24, width: 28, height: 28, backgroundColor: '#FFD45B', borderWidth: 3, borderColor: '#E89A25' },
  cloudPixel: { position: 'absolute', width: 56, height: 12, backgroundColor: '#EAF7F7', borderWidth: 2, borderColor: '#C4E5E8' },
  cityStrip: { position: 'absolute', left: 0, right: 0, top: 105, height: 45, flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 18, gap: 8, backgroundColor: '#90BEAF' },
  cityBlock: { flex: 1, height: 22, backgroundColor: '#8B735C', borderTopWidth: 3, borderColor: '#66523E' },
  eventRibbon: { position: 'absolute', top: 4, left: 8, right: 78, backgroundColor: C.orange, borderWidth: 2, borderColor: '#7D2C0B', padding: 4, zIndex: 10 },
  eventText: { color: '#FFF0BF', fontSize: 9, fontWeight: '900' },
  stallRoof: { position: 'absolute', top: 104, left: '6%', right: '6%', height: 28, backgroundColor: '#56514B', borderWidth: 3, borderColor: '#2A2723', flexDirection: 'row', overflow: 'hidden' },
  roofStripe: { flex: 1, borderRightWidth: 2, borderColor: '#302E2A', backgroundColor: '#78716A' },
  stallBody: { position: 'absolute', top: 126, left: '8%', right: '8%', height: 164, backgroundColor: '#2B251F', borderWidth: 4, borderColor: C.wood },
  stallHeader: { position: 'absolute', top: -23, left: 22, right: 22, height: 28, backgroundColor: C.wood, borderWidth: 3, borderColor: '#B36A25', alignItems: 'center', justifyContent: 'center', zIndex: 4 },
  stallHeaderText: { color: C.gold, fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  stallInterior: { flex: 1, paddingTop: 18, paddingHorizontal: 14 },
  propShelf: { position: 'absolute', right: 12, top: 16, flexDirection: 'row', gap: 4, borderBottomWidth: 3, borderColor: C.wood2 },
  jar: { color: C.gold, fontSize: 15 },
  workerRow: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around' },
  helperCluster: { minWidth: 76, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', marginLeft: -8 },
  kettleStation: { alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 10 },
  kettleStationBoost: { backgroundColor: '#5E2B12', borderWidth: 2, borderColor: C.orange, paddingHorizontal: 8, paddingTop: 3 },
  steam: { color: '#F0ECE0', fontSize: 30, lineHeight: 25, fontWeight: '900' },
  kettleEmoji: { color: '#C7C2B8', fontSize: 30 },
  chaiTray: { color: C.gold, fontWeight: '900', marginTop: -4 },
  brewingLabel: { color: '#F4D98F', fontSize: 7, fontWeight: '900', marginTop: 2 },
  counterFront: { height: 42, backgroundColor: '#8A4B20', borderTopWidth: 4, borderColor: '#3B1C0A', alignItems: 'center', justifyContent: 'center' },
  counterText: { color: '#F4D98F', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  queueRoad: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 95, backgroundColor: C.road, borderTopWidth: 5, borderColor: '#B49A6E', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-evenly', paddingBottom: 5, paddingHorizontal: 4 },
  customerSlot: { width: '18%', alignItems: 'center', justifyContent: 'flex-end' },
  orderBubble: { minWidth: 28, height: 24, backgroundColor: '#FFF0BF', borderWidth: 2, borderColor: '#6F431C', alignItems: 'center', justifyContent: 'center', marginBottom: -2, zIndex: 3 },
  orderBubblePriority: { minWidth: 40, backgroundColor: '#FFE08A', borderColor: C.orange },
  orderBubbleText: { fontSize: 12 },
  patienceTrack: { width: 34, height: 5, borderWidth: 1, borderColor: '#28180C', backgroundColor: '#4A3D32' },
  patienceFill: { height: '100%', backgroundColor: C.green2 },
  patienceLow: { backgroundColor: C.red },
  emptyQueue: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyQueueText: { color: '#EED9AC', fontSize: 9, fontWeight: '900' },
  streakChip: { position: 'absolute', right: 8, bottom: 102, zIndex: 12, backgroundColor: '#512611', borderWidth: 2, borderColor: C.orange, paddingHorizontal: 7, paddingVertical: 4 },
  streakChipText: { color: '#FFF0BF', fontSize: 8, fontWeight: '900' },
  sceneStats: { flexDirection: 'row', backgroundColor: '#24160D', borderTopWidth: 3, borderColor: C.wood2 },
  sceneStat: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRightWidth: 1, borderColor: '#5D3A20' },
  sceneStatLabel: { color: '#A98A62', fontSize: 7, fontWeight: '900' },
  sceneStatValue: { color: C.cream, fontSize: 12, fontWeight: '900', marginTop: 1 },
  pressureStrip: { backgroundColor: '#3E581E', padding: 6, borderTopWidth: 2, borderColor: '#7EAF3D' },
  pressureStripHot: { backgroundColor: '#772815', borderColor: '#D86332' },
  pressureText: { color: '#FFF0BF', fontSize: 8, fontWeight: '900', textAlign: 'center' },

  tabsRow: { flexDirection: 'row', gap: 4 },
  tabButton: { flex: 1, minHeight: 53, backgroundColor: '#3A210F', borderWidth: 3, borderColor: '#6F3B16', alignItems: 'center', justifyContent: 'center' },
  tabButtonActive: { backgroundColor: '#6A3B12', borderColor: C.gold },
  tabIcon: { fontSize: 17 },
  tabLabel: { color: '#D4B57C', fontSize: 6.7, fontWeight: '900', marginTop: 2 },
  tabLabelActive: { color: '#FFF0BF' },

  upgradeDeck: { backgroundColor: '#2C190D', borderWidth: 3, borderColor: C.wood2, minHeight: 185, padding: 7 },
  cardScroller: { gap: 7, paddingRight: 7 },
  upgradeCard: { width: 142, backgroundColor: '#F2D99D', borderWidth: 4, borderColor: '#7A481E', padding: 8, alignItems: 'center', ...pixelShadow },
  upgradeCardDisabled: { opacity: 0.55 },
  upgradeTitle: { color: '#2E1B0D', fontSize: 11, fontWeight: '900', textAlign: 'center', minHeight: 28 },
  upgradeIcon: { fontSize: 34, marginVertical: 5 },
  upgradeLevel: { color: '#397619', fontSize: 10, fontWeight: '900' },
  upgradeDescription: { color: '#3F2B16', fontSize: 9, fontWeight: '800', textAlign: 'center', minHeight: 28, marginTop: 3 },
  priceButton: { width: '100%', minHeight: 42, backgroundColor: C.green, borderWidth: 3, borderColor: '#2E5811', paddingVertical: 9, alignItems: 'center', justifyContent: 'center', marginTop: 7 },
  priceButtonDisabled: { backgroundColor: '#665746', borderColor: '#3D3328' },
  priceText: { color: '#FFF3C8', fontSize: 11, fontWeight: '900' },
  venueCard: { backgroundColor: '#F2D99D', borderWidth: 4, borderColor: '#7A481E', padding: 11 },
  venueEyebrow: { color: '#8A5B25', fontSize: 8, fontWeight: '900' },
  venueCardTitle: { color: '#2E1B0D', fontSize: 17, fontWeight: '900', marginTop: 2 },
  venueCardBody: { color: '#50391F', fontSize: 10, fontWeight: '800', marginTop: 8 },
  requirementRow: { marginTop: 8 },
  requirementLabel: { color: '#5D421F', fontSize: 8, fontWeight: '900' },
  requirementValue: { color: '#2E1B0D', fontSize: 9, fontWeight: '900', marginBottom: 3 },
  venueButton: { backgroundColor: C.orange, borderWidth: 3, borderColor: '#7E2E0C', padding: 9, alignItems: 'center', marginTop: 12 },
  venueButtonText: { color: '#FFF3C8', fontSize: 11, fontWeight: '900' },

  objectivesPanel: { gap: 6, backgroundColor: '#2C190D', borderWidth: 3, borderColor: C.wood2, padding: 7 },
  objectivesTitle: { color: C.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  objectiveStrip: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: '#F2D99D', borderWidth: 3, borderColor: '#7A481E', padding: 7 },
  objectiveStripReady: { borderColor: C.green2 },
  objectiveIcon: { width: 38, height: 38, backgroundColor: '#6B3B16', borderWidth: 3, borderColor: '#3F210C', alignItems: 'center', justifyContent: 'center' },
  objectiveIconText: { color: C.gold, fontSize: 20, fontWeight: '900' },
  objectiveLabel: { color: '#34200F', fontSize: 9, fontWeight: '900', marginBottom: 4 },
  objectiveProgress: { color: '#5A431F', fontSize: 8, fontWeight: '800', marginTop: 3 },
  claimButton: { minWidth: 58, minHeight: 42, backgroundColor: C.green, borderWidth: 3, borderColor: '#315912', paddingHorizontal: 8, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
  claimButtonDisabled: { opacity: 0.45 },
  claimText: { color: '#FFF4C9', fontSize: 9, fontWeight: '900' },

  bottomNav: { flexDirection: 'row', gap: 4, alignItems: 'stretch' },
  bottomNavItem: { flex: 1, minHeight: 54, backgroundColor: '#3A210F', borderWidth: 3, borderColor: '#6F3B16', alignItems: 'center', justifyContent: 'center' },
  bottomNavItemActive: { backgroundColor: '#6A3B12', borderColor: C.gold },
  bottomNavIcon: { fontSize: 17, color: C.gold },
  bottomNavLabel: { color: '#D7B77F', fontSize: 6.5, fontWeight: '900', marginTop: 2 },
  centerBadge: { flex: 1.35, backgroundColor: C.orange, borderWidth: 3, borderColor: '#7E2E0C', alignItems: 'center', justifyContent: 'center' },
  centerBadgeBoost: { backgroundColor: '#8C3214', borderColor: C.gold },
  centerBadgeCup: { fontSize: 18 },
  centerBadgeText: { color: '#FFF0BF', fontSize: 7, fontWeight: '900', marginTop: 1 },
});
