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
  buyTrackUpgrade,
  claimDailyObjective,
  dismissTutorialStep,
  getBottleneck,
  getDailyObjectives,
  getDerivedStats,
  getMilestones,
  getRecommendation,
  getTutorialStep,
  getVenueProgress,
  simulateTicks,
  unlockMenuItem,
  unlockNextVenue,
  unlockStaff,
} from '../game/simulation';

export const useGameState = () => {
  const [state, setState] = useState(createInitialState());
  const [isLoaded, setIsLoaded] = useState(false);
  const [offlineCoins, setOfflineCoins] = useState(0);
  const [recoveryNotice, setRecoveryNotice] = useState('');
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const boot = async () => {
      const bootResult = await bootGameState({ storage: AsyncStorage });
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
      setState((current) => ({ ...simulateTicks(current, 1), lastTickAt: Date.now(), venueUnlockedToast: null }));
    }, 1000);
    return () => clearInterval(timer);
  }, [isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;

    const persist = async () => {
      const serialized = JSON.stringify(serializeStateForSave(state));
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
    };

    persist();
  }, [isLoaded, state]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextStatus) => {
      if (appState.current.match(/inactive|background/) && nextStatus === 'active') {
        setState((current) => {
          const claimed = claimOfflineProgress(current, Date.now() - (current.lastTickAt || Date.now()));
          setOfflineCoins(claimed.offlineCoins);
          return { ...claimed.state, lastTickAt: Date.now() };
        });
      }
      if (nextStatus.match(/inactive|background/)) {
        setState((current) => ({ ...current, lastTickAt: Date.now() }));
      }
      appState.current = nextStatus;
    });
    return () => sub.remove();
  }, []);

  const stats = useMemo(() => getDerivedStats(state), [state]);
  const venueProgress = useMemo(() => getVenueProgress(state), [state]);
  const recommendation = useMemo(() => getRecommendation(state), [state]);
  const milestones = useMemo(() => getMilestones(state), [state]);
  const dailyObjectives = useMemo(() => getDailyObjectives(state), [state]);
  const tutorialStep = useMemo(() => getTutorialStep(state), [state]);
  const bottleneck = useMemo(() => getBottleneck(state), [state]);

  const buyUpgrade = useCallback((id) => setState((current) => buyTrackUpgrade(current, id)), []);
  const hireStaff = useCallback((id) => setState((current) => unlockStaff(current, id)), []);
  const buyMenuUnlock = useCallback((id) => setState((current) => unlockMenuItem(current, id)), []);
  const buyVenue = useCallback(() => setState((current) => unlockNextVenue(current)), []);
  const claimObjective = useCallback((id) => setState((current) => claimDailyObjective(current, id)), []);
  const dismissTutorial = useCallback((id) => setState((current) => dismissTutorialStep(current, id)), []);
  const clearOfflineCoins = useCallback(() => setOfflineCoins(0), []);
  const dismissRecoveryNotice = useCallback(() => setRecoveryNotice(''), []);
  const resetGame = useCallback(async () => {
    const fresh = createInitialState();
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
  };
};
