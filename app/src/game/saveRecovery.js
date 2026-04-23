import { hydrateState, migrateSaveData } from './createInitialState';

export const SAVE_KEY = 'chai-empire-save-v2';
export const LEGACY_SAVE_KEY = 'chai-empire-save-v1';
export const SAVE_BACKUP_KEY = 'chai-empire-save-backup';
export const SAVE_RECOVERY_META_KEY = 'chai-empire-save-recovery-meta';

export const parseStoredSaveCandidates = (candidates = []) => {
  let latestError = null;

  for (const candidate of candidates) {
    if (!candidate || typeof candidate.raw !== 'string' || !candidate.raw.trim()) {
      continue;
    }

    try {
      const migrated = migrateSaveData(JSON.parse(candidate.raw));
      return {
        state: hydrateState(migrated.state),
        source: candidate.source,
        raw: candidate.raw,
      };
    } catch (error) {
      latestError = error;
    }
  }

  if (latestError) {
    throw latestError;
  }

  return null;
};

export const buildCorruptedSaveRecovery = (error, now = Date.now()) => ({
  recoveryMeta: {
    corruptedAt: now,
    reason: String(error),
  },
  keysToRemove: [SAVE_KEY, LEGACY_SAVE_KEY],
});
