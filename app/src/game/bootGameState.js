import { createInitialState } from './createInitialState';
import { buildCorruptedSaveRecovery, LEGACY_SAVE_KEY, parseStoredSaveCandidates, SAVE_BACKUP_KEY, SAVE_KEY, SAVE_RECOVERY_META_KEY } from './saveRecovery';
import { claimOfflineProgress } from './simulation';

export const loadStoredSave = async (storage) => {
  const [currentRaw, legacyRaw, backupRaw] = await Promise.all([
    storage.getItem(SAVE_KEY),
    storage.getItem(LEGACY_SAVE_KEY),
    storage.getItem(SAVE_BACKUP_KEY),
  ]);

  return parseStoredSaveCandidates([
    { key: SAVE_KEY, raw: currentRaw, source: 'primary' },
    { key: LEGACY_SAVE_KEY, raw: legacyRaw, source: 'legacy' },
    { key: SAVE_BACKUP_KEY, raw: backupRaw, source: 'backup' },
  ]);
};

export const bootGameState = async ({ storage, now = Date.now }) => {
  try {
    const loaded = await loadStoredSave(storage);
    const bootedAt = now();

    if (loaded?.state) {
      const saved = loaded.state;
      const claimed = claimOfflineProgress(saved, bootedAt - (saved.lastTickAt || bootedAt));
      return {
        state: { ...claimed.state, lastTickAt: bootedAt },
        offlineCoins: claimed.offlineCoins,
        recoveryNotice:
          loaded.source === 'backup'
            ? 'Recovered from backup save.'
            : loaded.source === 'legacy'
              ? 'Updated an older save format.'
              : '',
      };
    }

    return {
      state: createInitialState(),
      offlineCoins: 0,
      recoveryNotice: '',
    };
  } catch (error) {
    const recovery = buildCorruptedSaveRecovery(error, now());
    await Promise.all([
      storage.setItem(SAVE_RECOVERY_META_KEY, JSON.stringify(recovery.recoveryMeta)),
      ...recovery.keysToRemove.map((key) => storage.removeItem(key)),
    ]);

    return {
      state: createInitialState(),
      offlineCoins: 0,
      recoveryNotice: 'Save data was unreadable, so a fresh kettle was started.',
    };
  }
};
