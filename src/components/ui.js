import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { getUserColor } from '../lib/constants';

export const SectorBadge = ({ sector, small = false }) => {
  if (!sector) return null;
  const colors = {
    'Technology': 'bg-blue-600', 'Healthcare': 'bg-pink-600',
    'Financial Services': 'bg-green-600', 'Financials': 'bg-green-600',
    'Consumer Cyclical': 'bg-orange-600', 'Communication Services': 'bg-purple-600',
    'Industrials': 'bg-gray-600', 'Consumer Defensive': 'bg-teal-600',
    'Energy': 'bg-yellow-600', 'Utilities': 'bg-cyan-600',
    'Real Estate': 'bg-indigo-600', 'Basic Materials': 'bg-amber-600',
  };
  return (
    <span className={`${small ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-0.5 text-xs'} rounded font-medium text-white ${colors[sector] || 'bg-slate-600'}`}>
      {sector}
    </span>
  );
};

export const PerformanceCell = ({ value, small = false }) => {
  if (value === null || value === undefined || isNaN(value)) {
    return <span className="text-slate-500">&mdash;</span>;
  }
  const isPositive = value >= 0;
  return (
    <span className={`font-semibold ${small ? 'text-xs' : ''} ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
      {isPositive ? '+' : ''}{value.toFixed(2)}%
    </span>
  );
};

export const UserAvatar = ({ username, size = 'sm' }) => {
  const color = getUserColor(username);
  const sizeClasses = { sm: 'w-6 h-6 text-xs', md: 'w-8 h-8 text-sm', lg: 'w-10 h-10 text-base' };
  return (
    <div className={`${sizeClasses[size]} ${color.bg} rounded-full flex items-center justify-center text-white font-bold`}>
      {username.charAt(0).toUpperCase()}
    </div>
  );
};

export const StanceBadge = ({ stance }) => {
  if (stance === 'bull') {
    return <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs font-medium"><TrendingUp className="w-3 h-3" /> Bull</span>;
  }
  if (stance === 'bear') {
    return <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs font-medium"><TrendingDown className="w-3 h-3" /> Bear</span>;
  }
  return null;
};

export const MiniChart = ({ data, isPositive, height = 60 }) => {
  if (!data || data.length === 0) {
    return <div style={{ height }} className="flex items-center justify-center text-slate-500 text-sm">No data</div>;
  }
  const chartData = data.slice(-30);
  const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity={0.3} />
            <stop offset="100%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="price" stroke={isPositive ? '#22c55e' : '#ef4444'} fill={`url(#${gradientId})`} strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
};
