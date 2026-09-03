import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { menuItems, staffUnlocks, upgradeTracks } from '../data/gameData';
import {
  createInitialState,
  serializeStateForSave,
} from '../game/createInitialState';
import { LEGACY_SAVE_KEY, SAVE_BACKUP_KEY, SAVE_KEY, SAVE_RECOVERY_META_KEY } from '../game/saveRecovery';
import { bootGameState } from '../game/bootGameState';
import {
  acceptPriorityOrder,
  activateKettleBoost,
  buyTrackUpgrade,
  cancelActiveBrew,
  claimDailyObjective,
  claimMilestoneReward,
  claimOfflineProgress,
  chooseServiceAction,
  dismissTutorialStep,
  getBottleneck,
  getDailyObjectives,
  getDerivedStats,
  getMilestones,
  getServiceChoices,
  getRecommendation,
  getTutorialStep,
  getVenueProgress,
  simulateTicks,
  prepareSessionReward,
  resolvePendingReward,
  shooThief,
  startActiveBrew,
  tapActiveBrewStage,
  unlockMenuItem,
  unlockNextVenue,
  unlockStaff,
} from '../game/simulation';

const AUTOSAVE_INTERVAL_MS = 5000;

export const useGameState = () => {
  const [state, setState] = useState(createInitialState());
  const [isLoaded, setIsLoaded] = useState(false);
  const [offlineCoins, setOfflineCoins] = useState(0);
  const [recoveryNotice, setRecoveryNotice] = useState('');
  const appState = useRef(AppState.currentState);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const persistState = useCallback(async (snapshot) => {
    if (!snapshot) return;
    const serialized = JSON.stringify(serializeStateForSave(snapshot));
    try {
      const previousRaw = await AsyncStorage.getItem(SAVE_KEY);
      if (previousRaw) {
        await AsyncStorage.setItem(SAVE_BACKUP_KEY, previousRaw);
      }
      await AsyncStorage.multiSet([
        [SAVE_KEY, serialized],
        [LEGACY_SAVE_KEY, serialized],
      ]);
    } catch (error) {
      console.warn('Failed to persist save data.', error);
    }
  }, []);

  useEffect(() => {
    const boot = async () => {
      const bootResult = await bootGameState({ storage: AsyncStorage });
      stateRef.current = bootResult.state;
      setState(bootResult.state);
      setOfflineCoins(bootResult.offlineCoins);
      setRecoveryNotice(bootResult.recoveryNotice);
      setIsLoaded(true);
    };

    boot();
  }, []);

  useEffect(() => {
    if (!isLoaded) return undefined;
    const timer = setInterval(() => {
      setState((current) => {
        const next = { ...simulateTicks(current, 1), lastTickAt: Date.now(), venueUnlockedToast: null };
        stateRef.current = next;
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isLoaded]);

  useEffect(() => {
    if (!isLoaded) return undefined;
    const autosaveTimer = setInterval(() => {
      persistState(stateRef.current);
    }, AUTOSAVE_INTERVAL_MS);

    return () => {
      clearInterval(autosaveTimer);
      persistState(stateRef.current);
    };
  }, [isLoaded, persistState]);

  useEffect(() => {
    if (!isLoaded) return undefined;

    const sub = AppState.addEventListener('change', (nextStatus) => {
      if (appState.current.match(/inactive|background/) && nextStatus === 'active') {
        setState((current) => {
          const claimed = claimOfflineProgress(current, Date.now() - (current.lastTickAt || Date.now()));
          const next = { ...claimed.state, lastTickAt: Date.now() };
          stateRef.current = next;
          setOfflineCoins(claimed.offlineCoins);
          return next;
        });
      }

      if (nextStatus.match(/inactive|background/)) {
        setState((current) => {
          const next = { ...cancelActiveBrew(current), lastTickAt: Date.now() };
          stateRef.current = next;
          persistState(next);
          return next;
        });
      }

      appState.current = nextStatus;
    });

    return () => sub.remove();
  }, [isLoaded, persistState]);

  const stats = useMemo(() => getDerivedStats(state), [state]);
  const venueProgress = useMemo(() => getVenueProgress(state), [state]);
  const recommendation = useMemo(() => getRecommendation(state), [state]);
  const milestones = useMemo(() => getMilestones(state), [state]);
  const dailyObjectives = useMemo(() => getDailyObjectives(state), [state]);
  const tutorialStep = useMemo(() => getTutorialStep(state), [state]);
  const bottleneck = useMemo(() => getBottleneck(state), [state]);
  const serviceChoices = useMemo(() => getServiceChoices(state), [state]);

  const acceptPriority = useCallback(() => setState((current) => acceptPriorityOrder(current)), []);
  const chaseThief = useCallback(() => setState((current) => shooThief(current)), []);
  const beginActiveBrew = useCallback(() => setState((current) => startActiveBrew(current)), []);
  const tapBrewStage = useCallback(() => setState((current) => tapActiveBrewStage(current)), []);
  const useKettleBoost = useCallback(() => setState((current) => activateKettleBoost(current)), []);
  const buyUpgrade = useCallback((id) => setState((current) => buyTrackUpgrade(current, id)), []);
  const hireStaff = useCallback((id) => setState((current) => unlockStaff(current, id)), []);
  const buyMenuUnlock = useCallback((id) => setState((current) => unlockMenuItem(current, id)), []);
  const buyVenue = useCallback(() => setState((current) => unlockNextVenue(current)), []);
  const claimObjective = useCallback((id) => setState((current) => claimDailyObjective(current, id)), []);
  const claimMilestone = useCallback((id) => setState((current) => claimMilestoneReward(current, id)), []);
  const dismissTutorial = useCallback((id) => setState((current) => dismissTutorialStep(current, id)), []);
  const clearOfflineCoins = useCallback(() => setOfflineCoins(0), []);
  const dismissRecoveryNotice = useCallback(() => setRecoveryNotice(''), []);
  const chooseService = useCallback((id) => setState((current) => chooseServiceAction(current, id)), []);
  const openSessionReward = useCallback(() => setState((current) => prepareSessionReward(current)), []);
  const claimPendingReward = useCallback((id, multiplier = 1) => setState((current) => resolvePendingReward(current, id, multiplier)), []);
  const resetGame = useCallback(async () => {
    const fresh = createInitialState();
    stateRef.current = fresh;
    setState(fresh);
    setOfflineCoins(0);
    setRecoveryNotice('');
    await AsyncStorage.multiRemove([SAVE_KEY, LEGACY_SAVE_KEY, SAVE_BACKUP_KEY, SAVE_RECOVERY_META_KEY]);
  }, []);

  return {
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
    chaseThief,
    beginActiveBrew,
    tapBrewStage,
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
  };
};
