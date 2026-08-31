import { customerTypes, gameEvents, menuItems, milestoneGoals, staffUnlocks, upgradeTracks, venueTiers } from '../data/gameData';
import { createDailyObjectives, createInitialDailyProgress, getLocalDayKey } from './createInitialState';
import { clamp } from '../utils/formatters';

const TICK_SECONDS = 1;
const OFFLINE_CAP_MINUTES = 120;
const OFFLINE_EFFICIENCY = 0.2;
const HEAT_DECAY_PER_SECOND = 1.4;
const HEAT_GAIN_FAST_SERVICE = 18;
const HEAT_GAIN_NORMAL_SERVICE = 10;
const HEAT_LOSS_SLOW_SERVICE = 16;

const getRushBonus = (heatMeter) => {
  if (heatMeter >= 85) {
    return {
      label: 'Peak Rush',
      payoutBoost: 0.18,
      arrivalBoost: 0.12,
      satisfactionFloor: 72,
    };
  }
  if (heatMeter >= 55) {
    return {
      label: 'Hot Streak',
      payoutBoost: 0.1,
      arrivalBoost: 0.06,
      satisfactionFloor: 68,
    };
  }
  if (heatMeter >= 25) {
    return {
      label: 'Warm Flow',
      payoutBoost: 0.04,
      arrivalBoost: 0.03,
      satisfactionFloor: 64,
    };
  }
  return {
    label: 'Steady Service',
    payoutBoost: 0,
    arrivalBoost: 0,
    satisfactionFloor: 20,
  };
};

const getVenue = (state) => venueTiers.find((venue) => venue.id === state.venueTier) || venueTiers[0];
const getUnlockedMenuEntries = (state) => menuItems.filter((item) => state.unlockedMenu.includes(item.id));
const getCustomerTypeById = (id) => customerTypes.find((customerType) => customerType.id === id) || customerTypes[0];
const getLevelsTotal = (state) =>
  Object.values(state.levels).reduce((sum, value) => sum + value, 0) + state.unlockedMenu.length + (state.staffOwned.length - 1) * 3;
const ensureDailyObjectives = (state) => {
  const todayKey = getLocalDayKey();
  if (state.dailyObjectives?.key === todayKey) return state;
  return {
    ...state,
    dailyObjectives: {
      key: todayKey,
      claimedIds: [],
      objectives: createDailyObjectives(todayKey),
      progress: createInitialDailyProgress(),
    },
  };
};

const getDailyProgress = (state) => state.dailyObjectives?.progress || createInitialDailyProgress();

const addDailyProgress = (state, delta) => {
  const safeState = ensureDailyObjectives(state);
  const progress = getDailyProgress(safeState);
  return {
    ...safeState,
    dailyObjectives: {
      ...safeState.dailyObjectives,
      progress: {
        totalServed: progress.totalServed + (delta.totalServed || 0),
        businessRevenue: progress.businessRevenue + (delta.businessRevenue || 0),
        premiumServed: progress.premiumServed + (delta.premiumServed || 0),
        upgradeCount: progress.upgradeCount + (delta.upgradeCount || 0),
      },
    },
  };
};

const getObjectiveMetricValue = (state, metric) => getDailyProgress(state)[metric] || 0;

const tutorialSteps = [
  {
    id: 'auto-earn',
    title: 'Customers come on their own',
    body: 'Your stall earns automatically. Watch the queue and spend coins at the right moment.',
    condition: (state) => state.totalServed >= 1,
  },
  {
    id: 'speed-upgrade',
    title: 'Upgrade your stove',
    body: 'Buy Better Stove once you can. Early traffic is tighter now, so speed pays off much faster.',
    condition: (state) => state.coins >= 25 && state.levels.speed === 0,
  },
  {
    id: 'menu-unlock',
    title: 'Unlock Masala Chai',
    body: 'Add a better menu item for stronger orders and higher revenue.',
    condition: (state) => state.lifetimeCoins >= 45 && !state.unlockedMenu.includes('masala-chai'),
  },
  {
    id: 'queue-pressure',
    title: 'Handle the rush',
    body: 'If the queue builds, improve speed or hire help before customers drop.',
    condition: (state) => state.queue.length >= 2,
  },
  {
    id: 'hire-helper',
    title: 'Hire a helper',
    body: 'A second worker is your biggest early jump in throughput.',
    condition: (state) => state.coins >= 150 && !state.staffOwned.includes(2),
  },
  {
    id: 'venue-goal',
    title: 'Aim for the next stall',
    body: 'Save up and build toward your first venue upgrade. That is the long game.',
    condition: (state) => state.lifetimeCoins >= 300 && state.venueTier === 1,
  },
];

export const getTrackCost = (track, level) => Math.round(track.baseCost * Math.pow(track.growth, level));
export const getVenueProgress = (state) => {
  const current = getVenue(state);
  const next = venueTiers.find((venue) => venue.id === state.venueTier + 1) || null;
  if (!next) {
    return { current, next, progress: 1 };
  }
  const progress = clamp(state.lifetimeCoins / next.upgradeCost, 0, 1);
  return { current, next, progress };
};

const getWeightedCustomerTypes = (state) => {
  const featuredId = state.activeEvent?.featuredCustomerTypeId;
  return customerTypes.map((customerType) => ({
    customerType,
    weight: Math.max(
      1,
      Math.round(customerType.arrivalWeight * (featuredId === customerType.id ? 1.85 : 1))
    ),
  }));
};

const getExpectedOrderProfile = (state, entries, qualityMultiplier, prepMultiplier, serviceMultiplier, rushBonus) => {
  if (!entries.length) {
    return { averagePayout: 0, averageServiceTime: 4 };
  }

  const weightedCustomers = getWeightedCustomerTypes(state);
  const totalCustomerWeight = weightedCustomers.reduce((sum, entry) => sum + entry.weight, 0) || 1;
  const eventPayoutMultiplier = 1 + (state.activeEvent?.payoutBoost || 0);

  let weightedPayout = 0;
  let weightedServiceTime = 0;

  for (const { customerType, weight: customerWeight } of weightedCustomers) {
    const weightedItems = entries.map((item) => ({
      item,
      weight: Math.max(1, Math.round(item.demandWeight * (customerType.preferences?.[item.id] || 1))),
    }));
    const totalItemWeight = weightedItems.reduce((sum, entry) => sum + entry.weight, 0) || 1;

    const customerPayout = weightedItems.reduce(
      (sum, entry) =>
        sum +
        entry.weight *
          entry.item.price *
          qualityMultiplier *
          customerType.spendMultiplier *
          eventPayoutMultiplier *
          (1 + rushBonus.payoutBoost),
      0
    ) / totalItemWeight;

    const customerServiceTime = weightedItems.reduce(
      (sum, entry) => sum + entry.weight * (entry.item.serviceTime / (prepMultiplier * serviceMultiplier)),
      0
    ) / totalItemWeight;

    weightedPayout += customerWeight * customerPayout;
    weightedServiceTime += customerWeight * customerServiceTime;
  }

  return {
    averagePayout: weightedPayout / totalCustomerWeight,
    averageServiceTime: weightedServiceTime / totalCustomerWeight,
  };
};

export const getDerivedStats = (state) => {
  const venue = getVenue(state);
  const unlockedMenuEntries = getUnlockedMenuEntries(state);
  const workerCount = state.staffOwned.length;
  const prepMultiplier = 1 + state.levels.speed * 0.15;
  const serviceMultiplier = 1 + state.levels.service * 0.1;
  const qualityMultiplier = 1 + state.levels.quality * 0.06;
  const reputationBonus = state.levels.reputation * 0.04;
  const menuVarietyBonus = Math.max(0, unlockedMenuEntries.length - 1) * 0.06;
  const eventBoost = state.activeEvent ? state.activeEvent.arrivalBoost : 0;
  const rushBonus = getRushBonus(state.heatMeter || 0);
  const arrivalPerMinute = venue.baseArrivalPerMinute * (1 + reputationBonus + menuVarietyBonus + eventBoost + rushBonus.arrivalBoost);
  const { averagePayout, averageServiceTime } = getExpectedOrderProfile(
    state,
    unlockedMenuEntries,
    qualityMultiplier,
    prepMultiplier,
    serviceMultiplier,
    rushBonus
  );
  const serviceCapacityPerMinute = averageServiceTime > 0 ? workerCount * (60 / averageServiceTime) : 0;
  const expectedOrdersPerMinute = Math.min(arrivalPerMinute, serviceCapacityPerMinute);
  const coinsPerMinute = expectedOrdersPerMinute * averagePayout;

  return {
    venue,
    workerCount,
    prepMultiplier,
    serviceMultiplier,
    qualityMultiplier,
    arrivalPerMinute,
    queueCapacity: venue.queueCapacity,
    averagePayout,
    averageServiceTime,
    coinsPerMinute,
    businessLevel: getLevelsTotal(state),
    reputationScore: Math.min(100, Math.round(20 + state.levels.reputation * 8 + state.satisfaction * 0.35)),
    unlockedMenuEntries,
    customerMix: customerTypes,
    rushBonus,
  };
};

const randomWeightedItem = (entries) => {
  const total = entries.reduce((sum, item) => sum + item.demandWeight, 0);
  let roll = Math.random() * total;
  for (const item of entries) {
    roll -= item.demandWeight;
    if (roll <= 0) return item;
  }
  return entries[0];
};

const randomWeightedCustomerTypeForState = (state) => {
  const weightedCustomerTypes = getWeightedCustomerTypes(state).map(({ customerType, weight }) => ({
    ...customerType,
    arrivalWeight: weight,
  }));
  const total = weightedCustomerTypes.reduce((sum, customerType) => sum + customerType.arrivalWeight, 0);
  let roll = Math.random() * total;
  for (const customerType of weightedCustomerTypes) {
    roll -= customerType.arrivalWeight;
    if (roll <= 0) return getCustomerTypeById(customerType.id);
  }
  return getCustomerTypeById(weightedCustomerTypes[0].id);
};

const pickItemForCustomerType = (entries, customerType) => {
  const weightedEntries = entries.map((item) => ({
    ...item,
    demandWeight: Math.round(item.demandWeight * (customerType.preferences?.[item.id] || 1)),
  }));
  return randomWeightedItem(weightedEntries);
};

const maybeStartEvent = (state) => {
  if (state.activeEvent || state.eventCooldown > 0 || Math.random() > 0.08) {
    return state;
  }
  const event = gameEvents[Math.floor(Math.random() * gameEvents.length)];
  return { ...state, activeEvent: { ...event, remaining: event.duration }, eventCooldown: 180 };
};

const tickEvent = (state) => {
  if (!state.activeEvent) {
    return { ...state, eventCooldown: Math.max(0, state.eventCooldown - 1) };
  }
  const remaining = state.activeEvent.remaining - TICK_SECONDS;
  if (remaining <= 0) {
    return { ...state, activeEvent: null, eventCooldown: 180 };
  }
  return { ...state, activeEvent: { ...state.activeEvent, remaining } };
};

export const simulateTicks = (inputState, totalSeconds) => {
  let state = ensureDailyObjectives({ ...inputState, queue: [...inputState.queue], activeOrders: [...inputState.activeOrders] });

  for (let second = 0; second < totalSeconds; second += 1) {
    state = tickEvent(maybeStartEvent(state));
    const stats = getDerivedStats(state);
    const entries = getUnlockedMenuEntries(state);

    let spawnProgress = state.spawnProgress + stats.arrivalPerMinute / 60;
    const queue = [...state.queue];

    while (spawnProgress >= 1) {
      if (queue.length < stats.queueCapacity) {
        const customerType = randomWeightedCustomerTypeForState(state);
        const item = pickItemForCustomerType(entries, customerType);
        const maxPatience = Math.max(8, customerType.patience + (state.activeEvent?.patienceDelta || 0));
        queue.push({
          id: `${Date.now()}-${Math.random()}`,
          itemId: item.id,
          wait: 0,
          patience: maxPatience,
          maxPatience,
          customerTypeId: customerType.id,
          customerEmoji: customerType.emoji,
          customerName: customerType.name,
          spendMultiplier: customerType.spendMultiplier * (1 + (state.activeEvent?.payoutBoost || 0)),
        });
      }
      spawnProgress -= 1;
    }

    const agedQueue = queue
      .map((customer) => ({ ...customer, wait: customer.wait + 1, patience: customer.patience - 1 }))
      .filter((customer) => customer.patience > 0);

    const freeWorkers = Math.max(0, stats.workerCount - state.activeOrders.length);
    const nextQueue = [...agedQueue];
    const activeOrders = state.activeOrders
      .map((order) => ({ ...order, remaining: order.remaining - 1 }))
      .filter((order) => order.remaining > 0);

    for (let i = 0; i < freeWorkers && nextQueue.length > 0; i += 1) {
      const customer = nextQueue.shift();
      const item = menuItems.find((entry) => entry.id === customer.itemId) || menuItems[0];
      activeOrders.push({
        id: customer.id,
        itemId: item.id,
        remaining: Math.max(1, Math.round(item.serviceTime / (stats.prepMultiplier * stats.serviceMultiplier))),
        waited: customer.wait,
        customerTypeId: customer.customerTypeId || 'regular',
        customerEmoji: customer.customerEmoji || '🙂',
        customerName: customer.customerName || 'Regular',
        spendMultiplier: customer.spendMultiplier || 1,
      });
    }

    let coinsGained = 0;
    let satisfaction = state.satisfaction;
    let servedCount = 0;
    let premiumServed = 0;
    let serviceStreak = state.serviceStreak || 0;
    let bestServiceStreak = state.bestServiceStreak || 0;
    let heatMeter = Math.max(0, (state.heatMeter || 0) - HEAT_DECAY_PER_SECOND);

    const unfinishedOrders = [];
    for (const order of activeOrders) {
      if (order.remaining <= 1) {
        const item = menuItems.find((entry) => entry.id === order.itemId) || menuItems[0];
        const payout = Math.round(
          item.price * stats.qualityMultiplier * (order.spendMultiplier || 1) * (1 + stats.rushBonus.payoutBoost)
        );
        const servedFast = order.waited <= 5;
        const happyBonus = servedFast ? 2 : -Math.min(12, order.waited - 5);
        satisfaction = clamp(
          satisfaction + happyBonus * 0.4,
          stats.rushBonus.satisfactionFloor,
          100
        );
        serviceStreak = servedFast ? serviceStreak + 1 : 0;
        bestServiceStreak = Math.max(bestServiceStreak, serviceStreak);
        heatMeter = clamp(
          heatMeter + (servedFast ? HEAT_GAIN_FAST_SERVICE : order.waited <= 8 ? HEAT_GAIN_NORMAL_SERVICE : -HEAT_LOSS_SLOW_SERVICE),
          0,
          100
        );
        coinsGained += payout;
        servedCount += 1;
        if (item.price >= 20) premiumServed += 1;
      } else {
        unfinishedOrders.push(order);
      }
    }

    state = {
      ...state,
      spawnProgress,
      queue: nextQueue,
      activeOrders: unfinishedOrders,
      coins: state.coins + coinsGained,
      lifetimeCoins: state.lifetimeCoins + coinsGained,
      totalServed: state.totalServed + servedCount,
      premiumServed: state.premiumServed + premiumServed,
      recentCoins: state.recentCoins + coinsGained,
      cpmWindow: [...state.cpmWindow, coinsGained].slice(-60),
      satisfaction,
      serviceStreak,
      bestServiceStreak,
      heatMeter,
    };
    state = addDailyProgress(state, {
      totalServed: servedCount,
      businessRevenue: coinsGained,
      premiumServed,
    });
  }

  return state;
};

export const getBottleneck = (state) => {
  const stats = getDerivedStats(state);
  const queuePressure = state.queue.length / Math.max(stats.queueCapacity, 1);
  if (queuePressure > 0.7) {
    return 'Need more speed';
  }
  if (stats.workerCount < Math.min(stats.venue.workerCap, 3) && state.coins >= 150) {
    return 'Need another worker';
  }
  if (state.unlockedMenu.length < Math.min(stats.venue.menuCap, 4)) {
    return 'Menu can earn more';
  }
  return 'Save for the next venue';
};

export const getRecommendation = (state) => {
  const stats = getDerivedStats(state);
  const queuePressure = state.queue.length / Math.max(stats.queueCapacity, 1);
  const nextVenue = venueTiers.find((venue) => venue.id === state.venueTier + 1) || null;
  const availableStaff = staffUnlocks.find(
    (staff) => !state.staffOwned.includes(staff.workerCount) && state.venueTier >= staff.requiredVenue
  );
  const availableMenu = menuItems.find(
    (item) => !state.unlockedMenu.includes(item.id) && item.venueMin <= state.venueTier
  );
  const businessGap = nextVenue ? Math.max(0, nextVenue.businessLevelRequired - stats.businessLevel) : 0;
  const reputationGap = nextVenue ? Math.max(0, nextVenue.reputationRequired - state.levels.reputation) : 0;

  if (queuePressure > 0.75) return { type: 'speed', label: 'Best next upgrade: Better Stove' };
  if (nextVenue && reputationGap > 0) {
    return { type: 'quality', label: `Best next move: ${reputationGap} more Signboard level${reputationGap > 1 ? 's' : ''} for ${nextVenue.name}` };
  }
  if (nextVenue && businessGap > 0 && businessGap <= 3 && availableMenu) {
    return { type: 'menu', label: `Best next unlock: ${availableMenu.name} to push ${nextVenue.name}` };
  }
  if (availableStaff && state.coins >= availableStaff.unlockCost * 0.75) {
    return { type: 'staff', label: `Best next upgrade: ${availableStaff.name}` };
  }
  if (availableMenu) return { type: 'menu', label: `Best next unlock: ${availableMenu.name}` };
  return { type: 'venue', label: 'Best next move: save for your venue upgrade' };
};

export const getMilestones = (state) =>
  milestoneGoals.map((goal) => {
    const value = state[goal.metric] || 0;
    return {
      ...goal,
      current: value,
      complete: value >= goal.target,
      progress: clamp(value / goal.target, 0, 1),
    };
  });

export const getTutorialStep = (state) => {
  if (!state.tutorial?.active) return null;
  const dismissedIds = state.tutorial?.dismissedStepIds || [];
  return tutorialSteps.find((step) => step.condition(state) && !dismissedIds.includes(step.id)) || null;
};

export const getDailyObjectives = (state) => {
  const safeState = ensureDailyObjectives(state);
  return safeState.dailyObjectives.objectives.map((objective) => {
    const current = getObjectiveMetricValue(safeState, objective.metric);
    const claimed = safeState.dailyObjectives.claimedIds.includes(objective.id);
    const complete = current >= objective.target;
    return {
      ...objective,
      current,
      claimed,
      complete,
      progress: clamp(current / objective.target, 0, 1),
    };
  });
};

export const buyTrackUpgrade = (state, trackId) => {
  state = ensureDailyObjectives(state);
  const track = upgradeTracks.find((entry) => entry.id === trackId);
  if (!track) return state;
  const currentLevel = state.levels[trackId];
  if (currentLevel >= track.maxLevel) return state;
  const cost = getTrackCost(track, currentLevel);
  if (state.coins < cost) return state;
  return addDailyProgress(
    {
      ...state,
      coins: state.coins - cost,
      levels: { ...state.levels, [trackId]: currentLevel + 1 },
    },
    { upgradeCount: 1 }
  );
};

export const unlockStaff = (state, staffId) => {
  state = ensureDailyObjectives(state);
  const staff = staffUnlocks.find((entry) => entry.id === staffId);
  if (!staff || state.staffOwned.includes(staff.workerCount)) return state;
  const stats = getDerivedStats(state);
  if (state.coins < staff.unlockCost || state.venueTier < staff.requiredVenue || staff.workerCount > stats.venue.workerCap) {
    return state;
  }
  return addDailyProgress(
    {
      ...state,
      coins: state.coins - staff.unlockCost,
      staffOwned: [...state.staffOwned, staff.workerCount],
    },
    { upgradeCount: 1 }
  );
};

export const unlockMenuItem = (state, itemId) => {
  state = ensureDailyObjectives(state);
  const item = menuItems.find((entry) => entry.id === itemId);
  if (!item || state.unlockedMenu.includes(item.id) || state.coins < item.unlockCost || item.venueMin > state.venueTier) {
    return state;
  }
  const stats = getDerivedStats(state);
  if (state.unlockedMenu.length >= stats.venue.menuCap) return state;
  return addDailyProgress(
    {
      ...state,
      coins: state.coins - item.unlockCost,
      unlockedMenu: [...state.unlockedMenu, item.id],
    },
    { upgradeCount: 1 }
  );
};

export const unlockNextVenue = (state) => {
  state = ensureDailyObjectives(state);
  const nextVenue = venueTiers.find((venue) => venue.id === state.venueTier + 1);
  if (!nextVenue) return state;
  const stats = getDerivedStats(state);
  if (
    state.coins < nextVenue.upgradeCost ||
    stats.businessLevel < nextVenue.businessLevelRequired ||
    state.levels.reputation < nextVenue.reputationRequired
  ) {
    return state;
  }
  return {
    ...state,
    coins: state.coins - nextVenue.upgradeCost,
    venueTier: nextVenue.id,
    venueUnlockedToast: `Unlocked ${nextVenue.name}`,
  };
};

export const claimDailyObjective = (state, objectiveId) => {
  state = ensureDailyObjectives(state);
  const objective = getDailyObjectives(state).find((entry) => entry.id === objectiveId);
  if (!objective || !objective.complete || objective.claimed) return state;
  return {
    ...state,
    coins: state.coins + objective.reward,
    lifetimeCoins: state.lifetimeCoins + objective.reward,
    dailyObjectives: {
      ...state.dailyObjectives,
      claimedIds: [...state.dailyObjectives.claimedIds, objectiveId],
    },
  };
};

export const dismissTutorialStep = (state, stepId) => {
  if (!state.tutorial?.active || !stepId) return state;
  const dismissed = state.tutorial.dismissedStepIds || [];
  if (dismissed.includes(stepId)) return state;
  const nextDismissed = [...dismissed, stepId];
  return {
    ...state,
    tutorial: {
      active: nextDismissed.length < tutorialSteps.length,
      dismissedStepIds: nextDismissed,
    },
  };
};

export const claimOfflineProgress = (state, elapsedMs) => {
  state = ensureDailyObjectives(state);
  const elapsedMinutes = Math.min(OFFLINE_CAP_MINUTES, Math.floor(elapsedMs / 60000));
  if (elapsedMinutes <= 0) return { state, offlineCoins: 0 };

  const recentSamples = state.cpmWindow.filter((value) => typeof value === 'number' && Number.isFinite(value) && value >= 0);
  const averageCpm = recentSamples.length
    ? (recentSamples.reduce((sum, value) => sum + value, 0) * 60) / recentSamples.length
    : getDerivedStats(state).coinsPerMinute;
  const offlineCoins = Math.round(averageCpm * elapsedMinutes * OFFLINE_EFFICIENCY);

  return {
    offlineCoins,
    state: {
      ...state,
      coins: state.coins + offlineCoins,
      lifetimeCoins: state.lifetimeCoins + offlineCoins,
    },
  };
};