// User avatar colors
export const USER_COLORS = [
  { bg: 'bg-blue-500', text: 'text-blue-500', light: 'bg-blue-500/20' },
  { bg: 'bg-green-500', text: 'text-green-500', light: 'bg-green-500/20' },
  { bg: 'bg-purple-500', text: 'text-purple-500', light: 'bg-purple-500/20' },
  { bg: 'bg-orange-500', text: 'text-orange-500', light: 'bg-orange-500/20' },
  { bg: 'bg-pink-500', text: 'text-pink-500', light: 'bg-pink-500/20' },
  { bg: 'bg-cyan-500', text: 'text-cyan-500', light: 'bg-cyan-500/20' },
];

export const getUserColor = (username) => {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
};

// Colors for comparison chart lines
export const COMPARISON_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ec4899', '#8b5cf6'];

// Sector colors for pie chart
export const SECTOR_COLORS = {
  'Technology': '#3b82f6',
  'Healthcare': '#ec4899',
  'Financial Services': '#22c55e',
  'Financials': '#22c55e',
  'Consumer Cyclical': '#f97316',
  'Communication Services': '#8b5cf6',
  'Industrials': '#6b7280',
  'Consumer Defensive': '#14b8a6',
  'Energy': '#eab308',
  'Utilities': '#06b6d4',
  'Real Estate': '#6366f1',
  'Basic Materials': '#f59e0b',
  'Unknown': '#94a3b8'
};

export const generateWatchlistId = () => Math.random().toString(36).substring(2, 10);
