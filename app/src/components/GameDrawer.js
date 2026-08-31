import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatCoins, formatPercent } from '../utils/formatters';

const PANEL_TITLES = {
  missions: 'DAILY MISSIONS',
  milestones: 'EMPIRE MILESTONES',
  rush: 'RUSH CONTROL',
  settings: 'STALL SETTINGS',
};

const rushTiers = [
  { threshold: 25, label: 'WARM FLOW', detail: '+4% payout · +3% arrivals' },
  { threshold: 55, label: 'HOT STREAK', detail: '+10% payout · +6% arrivals' },
  { threshold: 85, label: 'PEAK RUSH', detail: '+18% payout · +12% arrivals' },
];

export function GameDrawer({
  panel,
  onClose,
  dailyObjectives,
  milestones,
  state,
  stats,
  venueProgress,
  onClaimObjective,
  onReset,
}) {
  if (!panel) return null;

  return (
    <View style={styles.shell}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>CHAI EMPIRE v0.2</Text>
          <Text style={styles.title}>{PANEL_TITLES[panel] || 'EMPIRE PANEL'}</Text>
        </View>
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeButton}
          accessibilityRole="button"
          accessibilityLabel="Close panel"
        >
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} nestedScrollEnabled>
        {panel === 'missions' ? (
          <MissionsPanel objectives={dailyObjectives} onClaim={onClaimObjective} />
        ) : null}
        {panel === 'milestones' ? <MilestonesPanel milestones={milestones} /> : null}
        {panel === 'rush' ? <RushPanel state={state} stats={stats} /> : null}
        {panel === 'settings' ? (
          <SettingsPanel state={state} stats={stats} venueProgress={venueProgress} onReset={onReset} />
        ) : null}
      </ScrollView>
    </View>
  );
}

function MissionsPanel({ objectives, onClaim }) {
  const claimable = objectives.filter((objective) => objective.complete && !objective.claimed).length;
  return (
    <View style={styles.stack}>
      <SummaryBanner
        label={claimable ? `${claimable} REWARD${claimable === 1 ? '' : 'S'} READY` : 'KEEP THE KETTLE MOVING'}
        value={`${objectives.filter((objective) => objective.claimed).length}/${objectives.length} CLAIMED`}
      />
      {objectives.map((objective) => (
        <View key={objective.id} style={[styles.card, objective.complete && !objective.claimed && styles.cardReady]}>
          <View style={styles.cardTopRow}>
            <Text style={styles.cardTitle}>{objective.label.toUpperCase()}</Text>
            <Text style={styles.reward}>{formatCoins(objective.reward)}</Text>
          </View>
          <Progress value={objective.progress} />
          <View style={styles.cardBottomRow}>
            <Text style={styles.muted}>{objective.current}/{objective.target}</Text>
            <TouchableOpacity
              style={[styles.actionButton, (!objective.complete || objective.claimed) && styles.actionButtonDisabled]}
              disabled={!objective.complete || objective.claimed}
              onPress={() => onClaim(objective.id)}
            >
              <Text style={styles.actionText}>{objective.claimed ? 'CLAIMED' : objective.complete ? 'CLAIM' : 'IN PROGRESS'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
}

function MilestonesPanel({ milestones }) {
  const complete = milestones.filter((milestone) => milestone.complete).length;
  return (
    <View style={styles.stack}>
      <SummaryBanner label="EMPIRE RECORD" value={`${complete}/${milestones.length} COMPLETE`} />
      {milestones.map((milestone) => (
        <View key={milestone.id} style={[styles.card, milestone.complete && styles.cardComplete]}>
          <View style={styles.cardTopRow}>
            <Text style={styles.cardTitle}>{milestone.label.toUpperCase()}</Text>
            <Text style={styles.status}>{milestone.complete ? '✓ DONE' : `${Math.round(milestone.progress * 100)}%`}</Text>
          </View>
          <Progress value={milestone.progress} complete={milestone.complete} />
          <Text style={styles.muted}>{milestone.current}/{milestone.target}</Text>
        </View>
      ))}
    </View>
  );
}

function RushPanel({ state, stats }) {
  const heat = Math.round(state.heatMeter || 0);
  return (
    <View style={styles.stack}>
      <SummaryBanner label={stats.rushBonus.label.toUpperCase()} value={`${heat}% HEAT`} hot={heat >= 55} />
      <View style={styles.metricGrid}>
        <Metric label="CURRENT STREAK" value={state.serviceStreak || 0} />
        <Metric label="BEST STREAK" value={state.bestServiceStreak || 0} />
        <Metric label="MOOD" value={formatPercent(state.satisfaction)} />
        <Metric label="AVG TICKET" value={formatCoins(stats.averagePayout)} />
      </View>
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>RUSH LADDER</Text>
        {rushTiers.map((tier) => {
          const active = heat >= tier.threshold;
          return (
            <View key={tier.threshold} style={[styles.tierRow, active && styles.tierRowActive]}>
              <Text style={styles.tierThreshold}>{tier.threshold}%</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.tierTitle}>{tier.label}</Text>
                <Text style={styles.muted}>{tier.detail}</Text>
              </View>
              <Text style={styles.tierState}>{active ? 'ACTIVE' : 'LOCKED'}</Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.tip}>Fast service builds heat. Long waits break streaks and drain momentum.</Text>
    </View>
  );
}

function SettingsPanel({ state, stats, venueProgress, onReset }) {
  return (
    <View style={styles.stack}>
      <SummaryBanner label="CURRENT STALL" value={`TIER ${state.venueTier} · ${stats.venue.name.toUpperCase()}`} />
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>PROTOTYPE RULES</Text>
        <SettingRow label="Orientation" value="Portrait only" />
        <SettingRow label="Serving" value="Automatic" />
        <SettingRow label="Offline cap" value="2 hours" />
        <SettingRow label="Offline efficiency" value="20%" />
        <SettingRow label="Next venue" value={venueProgress.next?.name || 'Empire complete'} />
      </View>
      <View style={styles.warningCard}>
        <Text style={styles.warningTitle}>RESET LOCAL EMPIRE</Text>
        <Text style={styles.warningText}>This removes the local save from this device and starts again with a roadside stall.</Text>
        <TouchableOpacity style={styles.resetButton} onPress={onReset} accessibilityRole="button">
          <Text style={styles.resetText}>RESET SAVE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SummaryBanner({ label, value, hot = false }) {
  return (
    <View style={[styles.summary, hot && styles.summaryHot]}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function Metric({ label, value }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function SettingRow({ label, value }) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Text style={styles.settingValue}>{value}</Text>
    </View>
  );
}

function Progress({ value, complete = false }) {
  const clamped = Math.max(0, Math.min(1, value || 0));
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, complete && styles.progressComplete, { width: `${clamped * 100}%` }]} />
    </View>
  );
}

const C = {
  ink: '#190F08',
  dark: '#2A1609',
  wood: '#6B3814',
  wood2: '#9A541E',
  cream: '#F7E1A6',
  gold: '#F6B93B',
  green: '#5F9D22',
  green2: '#8EC43F',
  orange: '#D95F17',
  red: '#C63D22',
};

const styles = StyleSheet.create({
  shell: {
    maxHeight: 390,
    backgroundColor: C.ink,
    borderWidth: 4,
    borderColor: C.wood2,
  },
  header: {
    minHeight: 58,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.wood,
    borderBottomWidth: 3,
    borderColor: '#3A1D0A',
  },
  eyebrow: { color: '#D7B77F', fontSize: 7, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: C.gold, fontSize: 15, fontWeight: '900', letterSpacing: 1, marginTop: 2 },
  closeButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3A210F',
    borderWidth: 3,
    borderColor: '#7A481E',
  },
  closeText: { color: C.cream, fontWeight: '900', fontSize: 23, lineHeight: 24 },
  body: { backgroundColor: '#24150C' },
  bodyContent: { padding: 8 },
  stack: { gap: 7 },
  summary: {
    backgroundColor: '#315A1B',
    borderWidth: 3,
    borderColor: C.green2,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryHot: { backgroundColor: '#7A2D13', borderColor: C.orange },
  summaryLabel: { color: '#FFF1C6', fontSize: 9, fontWeight: '900' },
  summaryValue: { color: C.gold, fontSize: 10, fontWeight: '900' },
  card: { backgroundColor: '#F2D99D', borderWidth: 3, borderColor: '#7A481E', padding: 8 },
  cardReady: { borderColor: C.green, backgroundColor: '#F5E6B5' },
  cardComplete: { borderColor: '#557C2A' },
  cardTopRow: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { color: '#2E1B0D', fontSize: 9, fontWeight: '900', flex: 1 },
  reward: { color: '#397619', fontSize: 10, fontWeight: '900' },
  status: { color: '#397619', fontSize: 9, fontWeight: '900' },
  cardBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  muted: { color: '#5B482C', fontSize: 8, fontWeight: '800' },
  progressTrack: { height: 9, backgroundColor: '#5A4938', borderWidth: 2, borderColor: '#2E1B0D', marginTop: 7 },
  progressFill: { height: '100%', backgroundColor: C.green2 },
  progressComplete: { backgroundColor: C.gold },
  actionButton: { backgroundColor: C.green, borderWidth: 2, borderColor: '#315912', paddingHorizontal: 9, paddingVertical: 5 },
  actionButtonDisabled: { backgroundColor: '#776958', borderColor: '#554B3F' },
  actionText: { color: '#FFF4CB', fontSize: 7, fontWeight: '900' },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  metric: { width: '48.5%', backgroundColor: '#3A210F', borderWidth: 3, borderColor: C.wood2, padding: 8 },
  metricLabel: { color: '#BE9D69', fontSize: 7, fontWeight: '900' },
  metricValue: { color: C.cream, fontSize: 16, fontWeight: '900', marginTop: 3 },
  sectionLabel: { color: '#6A471F', fontSize: 8, fontWeight: '900', letterSpacing: 1, marginBottom: 5 },
  tierRow: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingVertical: 7, borderTopWidth: 1, borderColor: '#C9AF78' },
  tierRowActive: { backgroundColor: '#E9D18F' },
  tierThreshold: { width: 38, color: '#7A481E', fontSize: 10, fontWeight: '900' },
  tierTitle: { color: '#2E1B0D', fontSize: 9, fontWeight: '900' },
  tierState: { color: '#397619', fontSize: 7, fontWeight: '900' },
  tip: { color: '#D5BC8C', fontSize: 8, lineHeight: 12, textAlign: 'center', paddingHorizontal: 12 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, paddingVertical: 6, borderTopWidth: 1, borderColor: '#C9AF78' },
  settingLabel: { color: '#5B482C', fontSize: 8, fontWeight: '800' },
  settingValue: { color: '#2E1B0D', fontSize: 8, fontWeight: '900', textAlign: 'right' },
  warningCard: { backgroundColor: '#4A1D12', borderWidth: 3, borderColor: C.red, padding: 9 },
  warningTitle: { color: '#FFB98F', fontSize: 9, fontWeight: '900' },
  warningText: { color: '#F0C4A8', fontSize: 8, lineHeight: 12, marginTop: 4 },
  resetButton: { marginTop: 8, alignItems: 'center', backgroundColor: C.red, borderWidth: 3, borderColor: '#7E2515', paddingVertical: 8 },
  resetText: { color: '#FFF3D3', fontSize: 9, fontWeight: '900' },
});
