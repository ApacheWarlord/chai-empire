const getTodayKey = () => new Date().toISOString().slice(0, 10);

export const SAVE_SCHEMA_VERSION = 2;

const objectiveTemplates = [
  { id: 'serve-customers', label: 'Serve customers', metric: 'totalServed', targets: [20, 28, 36], rewards: [80, 110, 140] },
  { id: 'earn-coins', label: 'Earn revenue', metric: 'lifetimeCoins', targets: [350, 500, 700], rewards: [90, 120, 150] },
  { id: 'sell-premium', label: 'Sell premium items', metric: 'premiumServed', targets: [3, 5, 7], rewards: [100, 130, 160] },
  { id: 'unlock-items', label: 'Unlock upgrades or menu items', metric: 'upgradeCount', targets: [2, 3, 4], rewards: [85, 115, 145] },
];

export const createDailyObjectives = (todayKey = getTodayKey()) => {
  const daySeed = Number(todayKey.replace(/-/g, ''));
  return objectiveTemplates.slice(0, 3).map((template, index) => {
    const tier = (daySeed + index) % template.targets.length;
    return {
      id: `${todayKey}-${template.id}`,
      label: template.label,
      metric: template.metric,
      target: template.targets[tier],
      reward: template.rewards[tier],
    };
  });
};

export const createInitialState = () => ({
  coins: 80,
  lifetimeCoins: 80,
  totalServed: 0,
  premiumServed: 0,
  satisfaction: 84,
  queue: [],
  activeOrders: [],
  spawnProgress: 0,
  venueTier: 1,
  unlockedMenu: ['basic-chai'],
  levels: {
    speed: 0,
    service: 0,
    quality: 0,
    reputation: 0,
  },
  staffOwned: [1],
  activeEvent: null,
  eventCooldown: 45,
  lastTickAt: Date.now(),
  cpmWindow: [],
  recentCoins: 0,
  serviceStreak: 0,
  bestServiceStreak: 0,
  heatMeter: 0,
  venueUnlockedToast: null,
  dailyObjectives: {
    key: getTodayKey(),
    claimedIds: [],
    objectives: createDailyObjectives(),
  },
  tutorial: {
    active: true,
    dismissedStepIds: [],
  },
});

const toFiniteNumber = (value, fallback) => (typeof value === 'number' && Number.isFinite(value) ? value : fallback);

const sanitizeObjective = (objective) => {
  if (!objective || typeof objective !== 'object') return null;
  if (typeof objective.id !== 'string' || typeof objective.label !== 'string' || typeof objective.metric !== 'string') {
    return null;
  }

  return {
    id: objective.id,
    label: objective.label,
    metric: objective.metric,
    target: Math.max(1, Math.floor(toFiniteNumber(objective.target, 1))),
    reward: Math.max(0, Math.floor(toFiniteNumber(objective.reward, 0))),
  };
};

const sanitizeCustomerList = (value) => (Array.isArray(value) ? value.filter((entry) => entry && typeof entry === 'object') : []);

const sanitizeSavedState = (saved = {}, base = createInitialState()) => {
  const dailyObjectives = saved.dailyObjectives && typeof saved.dailyObjectives === 'object' ? saved.dailyObjectives : null;
  const tutorial = saved.tutorial && typeof saved.tutorial === 'object' ? saved.tutorial : null;

  const sanitized = {
    ...base,
    ...saved,
    coins: Math.max(0, toFiniteNumber(saved.coins, base.coins)),
    lifetimeCoins: Math.max(0, toFiniteNumber(saved.lifetimeCoins, base.lifetimeCoins)),
    totalServed: Math.max(0, Math.floor(toFiniteNumber(saved.totalServed, base.totalServed))),
    premiumServed: Math.max(0, Math.floor(toFiniteNumber(saved.premiumServed, base.premiumServed))),
    satisfaction: Math.min(100, Math.max(0, toFiniteNumber(saved.satisfaction, base.satisfaction))),
    spawnProgress: Math.max(0, toFiniteNumber(saved.spawnProgress, base.spawnProgress)),
    venueTier: Math.max(1, Math.floor(toFiniteNumber(saved.venueTier, base.venueTier))),
    eventCooldown: Math.max(0, Math.floor(toFiniteNumber(saved.eventCooldown, base.eventCooldown))),
    lastTickAt: Math.max(0, Math.floor(toFiniteNumber(saved.lastTickAt, base.lastTickAt))),
    recentCoins: Math.max(0, toFiniteNumber(saved.recentCoins, base.recentCoins)),
    serviceStreak: Math.max(0, Math.floor(toFiniteNumber(saved.serviceStreak, base.serviceStreak))),
    bestServiceStreak: Math.max(0, Math.floor(toFiniteNumber(saved.bestServiceStreak, base.bestServiceStreak))),
    heatMeter: Math.min(100, Math.max(0, toFiniteNumber(saved.heatMeter, base.heatMeter))),
    queue: sanitizeCustomerList(saved.queue),
    activeOrders: sanitizeCustomerList(saved.activeOrders),
    unlockedMenu: Array.isArray(saved.unlockedMenu) && saved.unlockedMenu.length ? saved.unlockedMenu.filter(Boolean) : base.unlockedMenu,
    staffOwned: Array.isArray(saved.staffOwned) && saved.staffOwned.length ? saved.staffOwned.filter((entry) => Number.isFinite(entry)) : base.staffOwned,
    cpmWindow: Array.isArray(saved.cpmWindow) ? saved.cpmWindow.filter((entry) => entry && typeof entry === 'object') : base.cpmWindow,
    levels: {
      ...base.levels,
      ...(saved.levels && typeof saved.levels === 'object' ? saved.levels : {}),
    },
    dailyObjectives: dailyObjectives
      ? {
          ...base.dailyObjectives,
          ...dailyObjectives,
          key: typeof dailyObjectives.key === 'string' ? dailyObjectives.key : base.dailyObjectives.key,
          claimedIds: Array.isArray(dailyObjectives.claimedIds) ? dailyObjectives.claimedIds.filter(Boolean) : [],
          objectives: Array.isArray(dailyObjectives.objectives)
            ? dailyObjectives.objectives.map(sanitizeObjective).filter(Boolean)
            : base.dailyObjectives.objectives,
        }
      : base.dailyObjectives,
    tutorial: tutorial
      ? {
          ...base.tutorial,
          ...tutorial,
          active: typeof tutorial.active === 'boolean' ? tutorial.active : base.tutorial.active,
          dismissedStepIds: Array.isArray(tutorial.dismissedStepIds) ? tutorial.dismissedStepIds.filter(Boolean) : [],
        }
      : base.tutorial,
  };

  sanitized.lifetimeCoins = Math.max(sanitized.lifetimeCoins, sanitized.coins);
  sanitized.premiumServed = Math.min(sanitized.premiumServed, sanitized.totalServed);
  sanitized.bestServiceStreak = Math.max(sanitized.bestServiceStreak, sanitized.serviceStreak);

  return sanitized;
};

export const migrateSaveData = (payload) => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Save payload is missing');
  }

  if (payload.schemaVersion === SAVE_SCHEMA_VERSION && payload.state && typeof payload.state === 'object') {
    return {
      schemaVersion: SAVE_SCHEMA_VERSION,
      state: sanitizeSavedState(payload.state),
    };
  }

  if (payload.schemaVersion == null) {
    return {
      schemaVersion: SAVE_SCHEMA_VERSION,
      state: sanitizeSavedState(payload),
    };
  }

  if (payload.schemaVersion > SAVE_SCHEMA_VERSION) {
    throw new Error(`Save schema ${payload.schemaVersion} is newer than supported schema ${SAVE_SCHEMA_VERSION}`);
  }

  if (payload.state && typeof payload.state === 'object') {
    return {
      schemaVersion: SAVE_SCHEMA_VERSION,
      state: sanitizeSavedState(payload.state),
    };
  }

  throw new Error('Save payload shape is invalid');
};

export const serializeStateForSave = (state) => ({
  schemaVersion: SAVE_SCHEMA_VERSION,
  savedAt: Date.now(),
  state: sanitizeSavedState(state),
});

export const hydrateState = (saved = {}) => sanitizeSavedState(saved);
