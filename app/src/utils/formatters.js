export const formatCoins = (value) => `₹${Math.round(value).toLocaleString('en-IN')}`;

export const formatPercent = (value) => `${Math.round(value)}%`;

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
