import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

const LargeChart = ({ data, symbol }) => {
  const [range, setRange] = useState('1M');

  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    const ranges = { '1W': 5, '1M': 22, '3M': 66, '6M': 132, '1Y': 252, '5Y': 1260 };
    const sliceAmount = ranges[range] || 22;
    return data.slice(-Math.min(sliceAmount, data.length));
  }, [data, range]);

  if (!data || data.length === 0) {
    return (
      <div className="bg-slate-900 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-4">{symbol} Price Chart</h3>
        <div className="h-48 flex items-center justify-center text-slate-500">No chart data available</div>
      </div>
    );
  }

  const isPositive = filteredData.length > 1 && filteredData[filteredData.length - 1].price >= filteredData[0].price;
  const gradientId = `large-gradient-${symbol}`;

  return (
    <div className="bg-slate-900 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-semibold">{symbol} Price Chart</h3>
        <div className="flex gap-1">
          {['1W', '1M', '3M', '6M', '1Y', '5Y'].map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-2 py-1 text-xs rounded ${range === r ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
              {r}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={filteredData}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity={0.3} />
              <stop offset="100%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }}
            tickFormatter={(d) => { const date = new Date(d); return `${date.getMonth() + 1}/${date.getDate()}`; }}
            interval="preserveStartEnd" />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} domain={['auto', 'auto']}
            tickFormatter={(v) => `$${v.toFixed(0)}`} />
          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
            labelStyle={{ color: '#94a3b8' }}
            formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Price']}
            labelFormatter={(label) => new Date(label).toLocaleDateString()} />
          <Area type="monotone" dataKey="price" stroke={isPositive ? '#22c55e' : '#ef4444'}
            fill={`url(#${gradientId})`} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LargeChart;
