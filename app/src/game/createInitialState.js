import { menuItems, milestoneGoals, staffUnlocks, upgradeTracks, venueTiers } from '../data/gameData';

export const getLocalDayKey = (date = new Date()) => {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const SAVE_SCHEMA_VERSION = 6;

const objectiveTemplates = [
  { id: 'serve-customers', label: 'Serve customers', metric: 'totalServed', targets: [20, 28, 36], rewards: [80, 110, 140] },
  { id: 'earn-coins', label: 'Earn revenue', metric: 'businessRevenue', targets: [350, 500, 700], rewards: [90, 120, 150] },
  { id: 'sell-premium', label: 'Sell premium items', metric: 'premiumServed', targets: [3, 5, 7], rewards: [100, 130, 160] },
  { id: 'unlock-items', label: 'Unlock upgrades or menu items', metric: 'upgradeCount', targets: [2, 3, 4], rewards: [85, 115, 145] },
];

export const createDailyObjectives = (todayKey = getLocalDayKey()) => {
  const daySeed = Number(todayKey.replace(/-/g, ''));
  return Array.from({ length: 3 }, (_, index) => {
    const template = objectiveTemplates[(daySeed + index) % objectiveTemplates.length];
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

export const createInitialDailyProgress = () => ({
  totalServed: 0,
  businessRevenue: 0,
  premiumServed: 0,
  upgradeCount: 0,
});

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
  kettleBoostRemaining: 0,
  kettleBoostCooldown: 0,
  kettleBoostUses: 0,
  priorityOffer: null,
  priorityOfferCooldown: 22,
  priorityOrdersAccepted: 0,
  priorityOrdersCompleted: 0,
  priorityOrdersMissed: 0,
  venueUnlockedToast: null,
  claimedMilestoneIds: [],
  dailyObjectives: {
    key: getLocalDayKey(),
    claimedIds: [],
    objectives: createDailyObjectives(),
    progress: createInitialDailyProgress(),
  },
  tutorial: {
    active: true,
    dismissedStepIds: [],
  },
});

const toFiniteNumber = (value, fallback) => (typeof value === 'number' && Number.isFinite(value) ? value : fallback);

const clampInteger = (value, fallback, min, max) =>
  Math.min(max, Math.max(min, Math.floor(toFiniteNumber(value, fallback))));

const validMenuIds = new Set(menuItems.map((item) => item.id));
const validMilestoneIds = new Set(milestoneGoals.map((goal) => goal.id));
const validStaffCounts = new Set([1, ...staffUnlocks.map((staff) => staff.workerCount)]);
const maxVenueTier = Math.max(...venueTiers.map((venue) => venue.id));

const sanitizeLevels = (value, baseLevels) => {
  const savedLevels = value && typeof value === 'object' ? value : {};
  return upgradeTracks.reduce((levels, track) => {
    levels[track.id] = clampInteger(savedLevels[track.id], baseLevels[track.id] || 0, 0, track.maxLevel);
    return levels;
  }, {});
};

const sanitizeUnlockedMenu = (value, baseMenu) => {
  const source = Array.isArray(value) ? value : baseMenu;
  const uniqueValid = [...new Set(source.filter((entry) => typeof entry === 'string' && validMenuIds.has(entry)))];
  if (!uniqueValid.includes('basic-chai')) uniqueValid.unshift('basic-chai');
  return uniqueValid.length ? uniqueValid : [...baseMenu];
};

const sanitizeStaffOwned = (value, baseStaff) => {
  const source = Array.isArray(value) ? value : baseStaff;
  const saved = new Set(source.filter((entry) => Number.isFinite(entry) && validStaffCounts.has(entry)));
  const normalized = [1];
  for (let workerCount = 2; validStaffCounts.has(workerCount); workerCount += 1) {
    if (!saved.has(workerCount)) break;
    normalized.push(workerCount);
  }
  return normalized;
};

const sanitizeObjective = (objective) => {
  if (!objective || typeof objective !== 'object') return null;
  if (typeof objective.id !== 'string' || typeof objective.label !== 'string' || typeof objective.metric !== 'string') {
    return null;
  }

  return {
    id: objective.id,
    label: objective.label,
    metric: objective.metric === 'lifetimeCoins' ? 'businessRevenue' : objective.metric,
    target: Math.max(1, Math.floor(toFiniteNumber(objective.target, 1))),
    reward: Math.max(0, Math.floor(toFiniteNumber(objective.reward, 0))),
  };
};

const sanitizeCustomerList = (value) => (Array.isArray(value) ? value.filter((entry) => entry && typeof entry === 'object') : []);

const sanitizePriorityOffer = (value) => {
  if (!value || typeof value !== 'object') return null;
  const itemId = typeof value.itemId === 'string' && validMenuIds.has(value.itemId) ? value.itemId : null;
  const remaining = Math.min(8, Math.max(0, toFiniteNumber(value.remaining, 0)));
  if (!itemId || remaining <= 0) return null;
  return {
    id: typeof value.id === 'string' ? value.id : 'priority-offer',
    itemId,
    remaining,
    customerTypeId: typeof value.customerTypeId === 'string' ? value.customerTypeId : 'regular',
    customerEmoji: typeof value.customerEmoji === 'string' ? value.customerEmoji : '⚡',
    customerName: typeof value.customerName === 'string' ? value.customerName : 'Priority Guest',
    spendMultiplier: Math.min(4, Math.max(1, toFiniteNumber(value.spendMultiplier, 2.2))),
  };
};

const sanitizeDailyProgress = (value) => {
  const progress = value && typeof value === 'object' ? value : {};
  return {
    totalServed: Math.max(0, Math.floor(toFiniteNumber(progress.totalServed, 0))),
    businessRevenue: Math.max(0, toFiniteNumber(progress.businessRevenue, 0)),
    premiumServed: Math.max(0, Math.floor(toFiniteNumber(progress.premiumServed, 0))),
    upgradeCount: Math.max(0, Math.floor(toFiniteNumber(progress.upgradeCount, 0))),
  };
};

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
    venueTier: clampInteger(saved.venueTier, base.venueTier, 1, maxVenueTier),
    eventCooldown: Math.max(0, Math.floor(toFiniteNumber(saved.eventCooldown, base.eventCooldown))),
    lastTickAt: Math.max(0, Math.floor(toFiniteNumber(saved.lastTickAt, base.lastTickAt))),
    recentCoins: Math.max(0, toFiniteNumber(saved.recentCoins, base.recentCoins)),
    serviceStreak: Math.max(0, Math.floor(toFiniteNumber(saved.serviceStreak, base.serviceStreak))),
    bestServiceStreak: Math.max(0, Math.floor(toFiniteNumber(saved.bestServiceStreak, base.bestServiceStreak))),
    heatMeter: Math.min(100, Math.max(0, toFiniteNumber(saved.heatMeter, base.heatMeter))),
    kettleBoostRemaining: Math.min(12, Math.max(0, toFiniteNumber(saved.kettleBoostRemaining, base.kettleBoostRemaining))),
    kettleBoostCooldown: Math.min(28, Math.max(0, toFiniteNumber(saved.kettleBoostCooldown, base.kettleBoostCooldown))),
    kettleBoostUses: Math.max(0, Math.floor(toFiniteNumber(saved.kettleBoostUses, base.kettleBoostUses))),
    priorityOffer: sanitizePriorityOffer(saved.priorityOffer),
    priorityOfferCooldown: Math.min(90, Math.max(0, toFiniteNumber(saved.priorityOfferCooldown, base.priorityOfferCooldown))),
    priorityOrdersAccepted: Math.max(0, Math.floor(toFiniteNumber(saved.priorityOrdersAccepted, base.priorityOrdersAccepted))),
    priorityOrdersCompleted: Math.max(0, Math.floor(toFiniteNumber(saved.priorityOrdersCompleted, base.priorityOrdersCompleted))),
    priorityOrdersMissed: Math.max(0, Math.floor(toFiniteNumber(saved.priorityOrdersMissed, base.priorityOrdersMissed))),
    claimedMilestoneIds: Array.isArray(saved.claimedMilestoneIds)
      ? [...new Set(saved.claimedMilestoneIds.filter((id) => typeof id === 'string' && validMilestoneIds.has(id)))]
      : base.claimedMilestoneIds,
    queue: sanitizeCustomerList(saved.queue),
    activeOrders: sanitizeCustomerList(saved.activeOrders),
    unlockedMenu: sanitizeUnlockedMenu(saved.unlockedMenu, base.unlockedMenu),
    staffOwned: sanitizeStaffOwned(saved.staffOwned, base.staffOwned),
    cpmWindow: Array.isArray(saved.cpmWindow)
      ? saved.cpmWindow.filter((entry) => typeof entry === 'number' && Number.isFinite(entry) && entry >= 0).slice(-60)
      : base.cpmWindow,
    levels: sanitizeLevels(saved.levels, base.levels),
    dailyObjectives: dailyObjectives
      ? {
          ...base.dailyObjectives,
          ...dailyObjectives,
          key: typeof dailyObjectives.key === 'string' ? dailyObjectives.key : base.dailyObjectives.key,
          claimedIds: Array.isArray(dailyObjectives.claimedIds) ? dailyObjectives.claimedIds.filter(Boolean) : [],
          objectives: Array.isArray(dailyObjectives.objectives)
            ? dailyObjectives.objectives.map(sanitizeObjective).filter(Boolean)
            : base.dailyObjectives.objectives,
          progress: sanitizeDailyProgress(dailyObjectives.progress),
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

  const venue = venueTiers.find((entry) => entry.id === sanitized.venueTier) || venueTiers[0];
  sanitized.staffOwned = sanitized.staffOwned.filter((workerCount) => workerCount <= venue.workerCap);
  const menuAvailableAtVenue = sanitized.unlockedMenu.filter((itemId) => {
    const item = menuItems.find((entry) => entry.id === itemId);
    return item && item.venueMin <= sanitized.venueTier;
  });
  sanitized.unlockedMenu = [
    'basic-chai',
    ...menuAvailableAtVenue.filter((itemId) => itemId !== 'basic-chai'),
  ].slice(0, venue.menuCap);
  const allowedMenuIds = new Set(sanitized.unlockedMenu);
  sanitized.queue = sanitized.queue.filter((customer) => allowedMenuIds.has(customer.itemId));
  sanitized.activeOrders = sanitized.activeOrders.filter((order) => allowedMenuIds.has(order.itemId));
  if (sanitized.priorityOffer && !allowedMenuIds.has(sanitized.priorityOffer.itemId)) {
    sanitized.priorityOffer = null;
  }

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
