import React, { useState, useMemo, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { Wallet, X } from 'lucide-react';

const PortfolioValueChart = ({ stockData, positions, currentUser, theme, onClose }) => {
  const [portfolioHistory, setPortfolioHistory] = useState(() => {
    const saved = localStorage.getItem('portfolio-history');
    return saved ? JSON.parse(saved) : [];
  });

  const currentValue = useMemo(() => {
    const userPositions = positions.filter(p => p.username === currentUser);
    return userPositions.reduce((sum, pos) => {
      const stock = stockData[pos.symbol];
      return sum + (stock ? stock.price * pos.shares : 0);
    }, 0);
  }, [stockData, positions, currentUser]);

  useEffect(() => {
    if (currentValue > 0) {
      const today = new Date().toISOString().split('T')[0];
      setPortfolioHistory(prev => {
        const filtered = prev.filter(p => p.date !== today);
        const newHistory = [...filtered, { date: today, value: currentValue }]
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(-90);
        localStorage.setItem('portfolio-history', JSON.stringify(newHistory));
        return newHistory;
      });
    }
  }, [currentValue]);

  const chartData = portfolioHistory.length > 1 ? portfolioHistory : [
    { date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], value: currentValue * 0.95 },
    { date: new Date().toISOString().split('T')[0], value: currentValue }
  ];

  const isPositive = chartData.length > 1 && chartData[chartData.length - 1].value >= chartData[0].value;
  const changePercent = chartData.length > 1
    ? ((chartData[chartData.length - 1].value - chartData[0].value) / chartData[0].value * 100)
    : 0;

  return (
    <div className={`rounded-xl p-4 mb-6 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white shadow-lg'}`}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className={`font-semibold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
            <Wallet className="w-5 h-5" /> Portfolio Value
          </h3>
          <div className="flex items-center gap-3 mt-1">
            <span className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
              ${currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={`text-sm font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
            </span>
          </div>
        </div>
        <button onClick={onClose} className={`p-1 rounded ${theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}>
          <X className="w-5 h-5" />
        </button>
      </div>

      <ResponsiveContainer width="100%" height={150}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity={0.3} />
              <stop offset="100%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tick={{ fill: theme === 'dark' ? '#94a3b8' : '#475569', fontSize: 10 }}
            tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            interval="preserveStartEnd" />
          <YAxis tick={{ fill: theme === 'dark' ? '#94a3b8' : '#475569', fontSize: 10 }}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} domain={['auto', 'auto']} />
          <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', border: 'none', borderRadius: '8px' }}
            labelFormatter={(label) => new Date(label).toLocaleDateString()}
            formatter={(value) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'Value']} />
          <Area type="monotone" dataKey="value" stroke={isPositive ? '#22c55e' : '#ef4444'} fill="url(#portfolioGradient)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PortfolioValueChart;
