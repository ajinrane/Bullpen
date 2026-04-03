import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { BarChart2, X } from 'lucide-react';
import { COMPARISON_COLORS } from '../lib/constants';

const ComparisonChart = ({ selectedStocks, stockData, theme, onClose }) => {
  const [range, setRange] = useState('1M');

  const chartData = useMemo(() => {
    if (selectedStocks.length === 0) return [];
    const ranges = { '1W': 5, '1M': 22, '3M': 66, '6M': 132, '1Y': 252, '5Y': 1260 };
    const sliceAmount = ranges[range] || 22;

    const stocksWithData = selectedStocks
      .map(symbol => ({ symbol, data: stockData[symbol]?.historicalData }))
      .filter(s => s.data && s.data.length > 0);

    if (stocksWithData.length === 0) return [];

    const minLength = Math.min(...stocksWithData.map(s => s.data.length), sliceAmount);
    const result = [];
    for (let i = 0; i < minLength; i++) {
      const dataPoint = { date: stocksWithData[0].data[stocksWithData[0].data.length - minLength + i]?.date };
      stocksWithData.forEach(({ symbol, data }) => {
        const slicedData = data.slice(-minLength);
        const firstPrice = slicedData[0]?.price;
        const currentPrice = slicedData[i]?.price;
        if (firstPrice && currentPrice) {
          dataPoint[symbol] = ((currentPrice - firstPrice) / firstPrice) * 100;
        }
      });
      result.push(dataPoint);
    }
    return result;
  }, [selectedStocks, stockData, range]);

  if (selectedStocks.length === 0) return null;

  return (
    <div className={`rounded-xl p-4 mb-6 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white shadow-lg'}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`font-semibold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
          <BarChart2 className="w-5 h-5" /> Performance Comparison
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {['1W', '1M', '3M', '6M', '1Y', '5Y'].map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-2 py-1 text-xs rounded ${range === r ? 'bg-blue-600 text-white' : theme === 'dark' ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>
                {r}
              </button>
            ))}
          </div>
          <button onClick={onClose}
            className={`p-1 rounded ${theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        {selectedStocks.map((symbol, idx) => (
          <div key={symbol} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COMPARISON_COLORS[idx % COMPARISON_COLORS.length] }} />
            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{symbol}</span>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chartData}>
          <XAxis dataKey="date" tick={{ fill: theme === 'dark' ? '#94a3b8' : '#475569', fontSize: 10 }}
            tickFormatter={(d) => { const date = new Date(d); return `${date.getMonth() + 1}/${date.getDate()}`; }}
            interval="preserveStartEnd" />
          <YAxis tick={{ fill: theme === 'dark' ? '#94a3b8' : '#475569', fontSize: 10 }}
            tickFormatter={(v) => `${v.toFixed(0)}%`} />
          <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff', border: theme === 'dark' ? 'none' : '1px solid #e2e8f0', borderRadius: '8px' }}
            labelStyle={{ color: theme === 'dark' ? '#94a3b8' : '#475569' }}
            formatter={(value, name) => [`${Number(value).toFixed(2)}%`, name]}
            labelFormatter={(label) => new Date(label).toLocaleDateString()} />
          {selectedStocks.map((symbol, idx) => (
            <Line key={symbol} type="monotone" dataKey={symbol}
              stroke={COMPARISON_COLORS[idx % COMPARISON_COLORS.length]} strokeWidth={2} dot={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ComparisonChart;
